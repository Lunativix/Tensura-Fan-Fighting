param(
  [Parameter(Mandatory=$true)][string]$Assets  # dossier contenant fx_*.png et arena_*.png
)

Add-Type -AssemblyName System.Drawing

$root = 'C:\Users\DENREE\Projects\tensura-fan-fighting'
$fxOut = Join-Path $root 'public\fx'
$stOut = Join-Path $root 'public\stages'
New-Item -ItemType Directory -Force -Path $fxOut | Out-Null
New-Item -ItemType Directory -Force -Path $stOut | Out-Null

# --- FX : re-decoupe en planche propre 1536x768 (8 cellules 384x384, marges noircies) ---
$cell = 384
function Prep-Fx {
  param([string]$name)
  $src = Join-Path $Assets "$name.png"
  if (-not (Test-Path $src)) { Write-Output "MISSING: $src"; return }
  $bmp = New-Object System.Drawing.Bitmap($src)
  $cw = [int]($bmp.Width / 4); $ch = [int]($bmp.Height / 2)
  # marge rognee cote source pour supprimer les lignes de separation entre cellules
  $m = [Math]::Max(6, [int]($cw * 0.02))
  $out = New-Object System.Drawing.Bitmap((4 * $cell), (2 * $cell))
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.Clear([System.Drawing.Color]::Black)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  for ($r = 0; $r -lt 2; $r++) {
    for ($c = 0; $c -lt 4; $c++) {
      $srcR = New-Object System.Drawing.Rectangle(($c * $cw + $m), ($r * $ch + $m), ($cw - 2 * $m), ($ch - 2 * $m))
      $dstR = New-Object System.Drawing.Rectangle(($c * $cell), ($r * $cell), $cell, $cell)
      $g.DrawImage($bmp, $dstR, $srcR, [System.Drawing.GraphicsUnit]::Pixel)
    }
  }
  $g.Dispose()
  $out.Save((Join-Path $fxOut "$name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
  $bmp.Dispose()
  Write-Output "fx: $name.png (1536x768)"
}

$fxNames = @('fx_switch_in','fx_switch_out','fx_assist','fx_emergency','fx_charge','fx_rage','fx_transform','fx_ultimate_flash','fx_ultimate_impact','fx_low_hp','fx_victory')
foreach ($n in $fxNames) { Prep-Fx $n }

# --- Arenes : copie vers public/stages avec noms courts ---
$stageMap = @{
  'arena_tempest_city'    = 'tempest_city'
  'arena_jura_forest'     = 'jura_forest'
  'arena_tempest_plains'  = 'tempest_plains'
  'arena_colosseum'       = 'colosseum'
  'arena_demon_realm'     = 'demon_realm'
  'arena_frozen_land'     = 'frozen_land'
  'arena_magic_temple'    = 'magic_temple'
  'arena_sky_battlefield' = 'sky_battlefield'
  'arena_dragon_domain'   = 'dragon_domain'
}
foreach ($k in $stageMap.Keys) {
  $src = Join-Path $Assets "$k.png"
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $stOut ($stageMap[$k] + '.png')) -Force
    Write-Output ("stage: " + $stageMap[$k] + ".png")
  } else {
    Write-Output "MISSING: $src"
  }
}

Write-Output 'PREP DONE'
