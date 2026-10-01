param(
  [Parameter(Mandatory=$true)][string]$Name,   # ex: Shion
  [Parameter(Mandatory=$true)][string]$Id,     # ex: shion
  [Parameter(Mandatory=$true)][string]$Assets  # dossier contenant <id>_<anim>.png
)

Add-Type -AssemblyName System.Drawing

$root   = 'C:\Users\DENREE\Projects\tensura-fan-fighting'
$pub    = Join-Path $root "public\sprites\$Id"
$lib    = Join-Path $root "characters\$Name\animations"
$sheets = Join-Path $root "characters\$Name\spritesheets"
New-Item -ItemType Directory -Force -Path $sheets | Out-Null

function CutSheet {
  param([string]$srcPath, [int]$cols, [int]$rows, [object[]]$dirPlan)
  if (-not (Test-Path $srcPath)) { Write-Output ("MISSING: " + $srcPath); return }
  $bmp = New-Object System.Drawing.Bitmap($srcPath)
  $cw = [int]($bmp.Width / $cols); $ch = [int]($bmp.Height / $rows)
  $planIdx = 0; $planUsed = 0; $localNum = 1
  New-Item -ItemType Directory -Force -Path $dirPlan[0].dir | Out-Null
  for ($r = 0; $r -lt $rows; $r++) {
    for ($c = 0; $c -lt $cols; $c++) {
      if ($planIdx -ge $dirPlan.Count) { break }
      $plan = $dirPlan[$planIdx]
      $out = New-Object System.Drawing.Bitmap($cw, $ch)
      $g = [System.Drawing.Graphics]::FromImage($out)
      $dst = New-Object System.Drawing.Rectangle(0, 0, $cw, $ch)
      $srcR = New-Object System.Drawing.Rectangle(($c * $cw), ($r * $ch), $cw, $ch)
      $g.DrawImage($bmp, $dst, $srcR, [System.Drawing.GraphicsUnit]::Pixel)
      $g.Dispose()
      $name = '{0:D3}.png' -f $localNum
      $out.Save((Join-Path $plan.dir $name), [System.Drawing.Imaging.ImageFormat]::Png)
      $out.Dispose()
      $planUsed++; $localNum++
      if ($planUsed -ge $plan.count) {
        $planIdx++; $planUsed = 0; $localNum = 1
        if ($planIdx -lt $dirPlan.Count) { New-Item -ItemType Directory -Force -Path $dirPlan[$planIdx].dir | Out-Null }
      }
    }
  }
  $bmp.Dispose()
  Write-Output ("cut: " + (Split-Path $srcPath -Leaf))
}

function Clean-Frame {
  param([string]$path)
  $bmp = New-Object System.Drawing.Bitmap($path)
  $w = $bmp.Width; $h = $bmp.Height
  $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bytes = New-Object byte[] ($data.Stride * $h)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

  $colHas = New-Object bool[] $w
  for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $data.Stride
    for ($x = 0; $x -lt $w; $x++) {
      if ($colHas[$x]) { continue }
      $i = $row + $x * 4
      $b = $bytes[$i]; $g = $bytes[$i+1]; $r = $bytes[$i+2]; $a = $bytes[$i+3]
      if ($a -gt 16 -and ($r -lt 235 -or $g -lt 235 -or $b -lt 235)) { $colHas[$x] = $true }
    }
  }

  $modified = $false
  $flags = @()
  $maxStrip = [int]($w * 0.22)

  # bande de contenu collee au bord droit = bavure de cellule voisine
  if ($colHas[$w-1] -or $colHas[$w-2]) {
    $xs = $w - 1
    while ($xs -gt 0 -and $colHas[$xs-1]) { $xs-- }
    if (($w - $xs) -le $maxStrip) {
      for ($y = 0; $y -lt $h; $y++) {
        $row = $y * $data.Stride
        for ($x = $xs; $x -lt $w; $x++) {
          $i = $row + $x * 4
          $bytes[$i] = 255; $bytes[$i+1] = 255; $bytes[$i+2] = 255; $bytes[$i+3] = 255
        }
      }
      $modified = $true
      $flags += "R-cleaned($($w-$xs)px)"
    } else { $flags += "R-touch-wide($($w-$xs)px)" }
  }

  if ($colHas[0] -or $colHas[1]) {
    $xe = 0
    while ($xe -lt ($w-1) -and $colHas[$xe+1]) { $xe++ }
    if (($xe + 1) -le $maxStrip) {
      for ($y = 0; $y -lt $h; $y++) {
        $row = $y * $data.Stride
        for ($x = 0; $x -le $xe; $x++) {
          $i = $row + $x * 4
          $bytes[$i] = 255; $bytes[$i+1] = 255; $bytes[$i+2] = 255; $bytes[$i+3] = 255
        }
      }
      $modified = $true
      $flags += "L-cleaned($($xe+1)px)"
    } else { $flags += "L-touch-wide($($xe+1)px)" }
  }

  if ($modified) { [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length) }
  $bmp.UnlockBits($data)
  if ($modified) { $bmp.Save($path + '.tmp', [System.Drawing.Imaging.ImageFormat]::Png) }
  $bmp.Dispose()
  if ($modified) { Move-Item ($path + '.tmp') $path -Force }
  if ($flags.Count -gt 0) { Write-Output ("{0} : {1}" -f $path.Replace($root, ''), ($flags -join ' ')) }
}

# --- decoupe ---
CutSheet (Join-Path $Assets "${Id}_idle.png")      4 2 @(@{dir="$pub\idle";      count=8})
CutSheet (Join-Path $Assets "${Id}_walk.png")      4 2 @(@{dir="$pub\walk";      count=8})
CutSheet (Join-Path $Assets "${Id}_run.png")       4 2 @(@{dir="$pub\run";       count=8})
CutSheet (Join-Path $Assets "${Id}_jump.png")      4 2 @(@{dir="$pub\jump";      count=4}, @{dir="$pub\fall"; count=4})
CutSheet (Join-Path $Assets "${Id}_attack.png")    4 2 @(@{dir="$pub\attack";    count=8})
CutSheet (Join-Path $Assets "${Id}_skill1.png")    4 2 @(@{dir="$pub\skill";     count=8})
CutSheet (Join-Path $Assets "${Id}_ultimate.png")  4 2 @(@{dir="$pub\ultimate";  count=8})
CutSheet (Join-Path $Assets "${Id}_hurt.png")      3 2 @(@{dir="$pub\hit";       count=6})
CutSheet (Join-Path $Assets "${Id}_guard.png")     3 2 @(@{dir="$pub\block";     count=6})
CutSheet (Join-Path $Assets "${Id}_knockback.png") 4 2 @(@{dir="$pub\knockdown"; count=6}, @{dir="$pub\getup"; count=2})
CutSheet (Join-Path $Assets "${Id}_ko.png")        4 2 @(@{dir="$pub\dead";      count=8})
CutSheet (Join-Path $Assets "${Id}_dash.png")      3 2 @(@{dir="$pub\dash";      count=6})
CutSheet (Join-Path $Assets "${Id}_heavy.png")     4 2 @(@{dir="$lib\heavy_attack"; count=8})
CutSheet (Join-Path $Assets "${Id}_victory.png")   4 2 @(@{dir="$lib\victory";      count=8})
CutSheet (Join-Path $Assets "${Id}_switch_in.png") 3 2 @(@{dir="$lib\switch_in";    count=6})
CutSheet (Join-Path $Assets "${Id}_switch_out.png") 3 2 @(@{dir="$lib\switch_out";  count=6})

# --- copie des planches maitres ---
$sheetMap = @{
  idle='idle'; walk='walk'; run='run'; jump='jump'; attack='light_attack'; heavy='heavy_attack';
  skill1='skill1'; ultimate='skill2'; hurt='hurt'; guard='guard'; knockback='knockback'; ko='ko';
  dash='dash'; victory='victory'; switch_in='switch_in'; switch_out='switch_out'
}
foreach ($k in $sheetMap.Keys) {
  $srcSheet = Join-Path $Assets "${Id}_$k.png"
  if (Test-Path $srcSheet) {
    Copy-Item $srcSheet (Join-Path $sheets ("${Name}_" + $sheetMap[$k] + '.png')) -Force
  }
}

# --- nettoyage des bavures ---
$targets = @()
if (Test-Path $pub) { $targets += Get-ChildItem $pub -Recurse -Filter '*.png' | Select-Object -ExpandProperty FullName }
if (Test-Path $lib) { $targets += Get-ChildItem $lib -Recurse -Filter '*.png' | Select-Object -ExpandProperty FullName }
foreach ($t in $targets) { Clean-Frame $t }

Write-Output ("DONE " + $Name + " : " + $targets.Count + " frames")
