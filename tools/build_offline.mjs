// The offline game for friends (2026-11-11, the user: "Can you build me a launcher for the game. An offline version that I
// can provide my friends"). A folder and a zip, nothing to install: double-click "Play Melon Realms.bat" and the game runs
// on this computer alone, in its own window.
//   dist/MelonRealms/Play Melon Realms.bat   starts launcher.ps1 (Windows' own PowerShell, no Node, no Python)
//   dist/MelonRealms/launcher.ps1            serves game/ to this computer only (http://localhost:47321), then opens it
//                                            in Edge's app mode (a window of its own, no address bar); any other browser
//                                            if Edge is missing. Starting it again while it runs just opens the window.
//   dist/MelonRealms/game/                   the game: index.html, style.css, src/, the art it loads (not the sources)
//   dist/MelonRealms/README.txt              for your friends
//   dist/MelonRealms.zip                     all of it, to send
// The copy is marked offline (window.REALM_OFFLINE, in its index.html): it never tries the multiplayer server, and the
// admin commands are closed there as for any player (--admin keeps them open). Saves stay in that computer's Edge.
//   node tools/build_offline.mjs [--admin]
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = join(ROOT, 'dist', 'MelonRealms'), GAME = join(OUT, 'game'), ADMIN = process.argv.includes('--admin');
rmSync(join(ROOT, 'dist'), { recursive: true, force: true });
mkdirSync(GAME, { recursive: true });

// ---- the game's own files (what the page loads; not the art's sources, sketches or reference packs)
for (const f of ['index.html', 'style.css']) cpSync(join(ROOT, f), join(GAME, f));
cpSync(join(ROOT, 'src'), join(GAME, 'src'), { recursive: true });
const ART_DIRS = ['bundle', 'sprites', 'world', 'rf', 'fonts', 'remaster'];
for (const d of ART_DIRS) if (existsSync(join(ROOT, 'art', d))) cpSync(join(ROOT, 'art', d), join(GAME, 'art', d), { recursive: true });
for (const f of readdirSync(join(ROOT, 'art'))) if (/\.(png|jpg)$/i.test(f)) cpSync(join(ROOT, 'art', f), join(GAME, 'art', f));

// ---- marked offline
const ip = join(GAME, 'index.html');
let html = readFileSync(ip, 'utf8');
const MARK = `<script>window.REALM_OFFLINE = true;${ADMIN ? ' window.REALM_OFFLINE_ADMIN = true;' : ''}</script>\n`;
if (!html.includes('<script type="module" src="src/main.js"></script>')) throw new Error('index.html: no main.js script tag to mark');
html = html.replace('<script type="module" src="src/main.js"></script>', MARK + '<script type="module" src="src/main.js"></script>');
writeFileSync(ip, html, 'utf8');

// ---- the launcher
writeFileSync(join(OUT, 'Play Melon Realms.bat'), `@echo off\r\ntitle Melon Realms\r\npowershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File "%~dp0launcher.ps1"\r\n`, 'utf8');
writeFileSync(join(OUT, 'launcher.ps1'), `# Melon Realms, offline: serves the game in .\\game to this computer only, then opens it in a window of its own.
# Close this window to stop the game.   (-NoOpen: serve only, for testing)
param([switch]$NoOpen)
$ErrorActionPreference = 'Stop'
$Root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'game'))
$Port = 47321
$Url = "http://localhost:$Port/"

function Open-Game {
  if ($NoOpen) { return }
  $edge = @("\${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe", "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe", "$env:LocalAppData\\Microsoft\\Edge\\Application\\msedge.exe") | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
  if ($edge) { Start-Process $edge -ArgumentList "--app=$Url", '--window-size=1400,900' } else { Start-Process $Url }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($Url)
try { $listener.Start() } catch {
  # (already running: just open the window)
  Open-Game; exit
}
$Host.UI.RawUI.WindowTitle = 'Melon Realms (close this window to stop the game)'
Write-Host ''
Write-Host '  Melon Realms is running.' -ForegroundColor Yellow
Write-Host "  It opens in its own window; if it does not, open $Url in any browser."
Write-Host '  Close this window when you are done playing.'
Write-Host ''
Open-Game

$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8';
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'; '.png' = 'image/png'; '.jpg' = 'image/jpeg';
  '.gif' = 'image/gif'; '.webp' = 'image/webp'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'; '.woff2' = 'font/woff2'; '.ttf' = 'font/ttf' }
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path.EndsWith('/')) { $path += 'index.html' }
    $file = [IO.Path]::GetFullPath((Join-Path $Root ($path.TrimStart('/'))))
    if (-not $file.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
      $res.StatusCode = 404
    } else {
      $bytes = [IO.File]::ReadAllBytes($file)
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
      $res.Headers['Cache-Control'] = 'no-cache'
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch { try { $res.StatusCode = 500 } catch {} } finally { try { $res.Close() } catch {} }
}
`, 'utf8');
writeFileSync(join(OUT, 'README.txt'), `MELON REALMS (offline)

To play: double-click "Play Melon Realms.bat".
The game opens in a window of its own. A small window named "Melon Realms" waits minimised on the taskbar:
close it when you are done playing.

Nothing is installed. The game runs on this computer only; it does not go online.
Your account and characters are kept by this computer's Microsoft Edge (for this game's address), so they are
there the next time you play. Clearing Edge's site data would erase them.

If Windows warns about the file ("Windows protected your PC"), choose "More info", then "Run anyway".
If no window opens, start it again, or open http://localhost:47321 in any browser while it runs.
Unzip the whole folder first: it does not run from inside the zip.
`, 'utf8');

// ---- the zip
const zip = join(ROOT, 'dist', 'MelonRealms.zip');
execFileSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${OUT}' -DestinationPath '${zip}' -Force`], { stdio: 'inherit' });
const size = (p) => { let n = 0; for (const f of readdirSync(p, { withFileTypes: true })) n += f.isDirectory() ? size(join(p, f.name)) : statSync(join(p, f.name)).size; return n; };
console.log(`dist/MelonRealms: ${(size(OUT) / 1e6).toFixed(1)} MB; dist/MelonRealms.zip: ${(statSync(zip).size / 1e6).toFixed(1)} MB${ADMIN ? ' (admin commands open)' : ''}`);
