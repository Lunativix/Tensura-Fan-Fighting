# Rebuild public/portraits from idle frames: edge flood-fill + fringe halo removal.
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'public\portraits'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$ids = @('rimuru','milim','diablo','benimaru','shion','veldora','hinata','guy','shuna','souei','hakurou')

function Punch-Bmp([System.Drawing.Bitmap]$bmp) {
  $w = $bmp.Width
  $h = $bmp.Height
  $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
  $lock = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $lock.Stride
  $bytes = New-Object byte[] ($stride * $h)
  [System.Runtime.InteropServices.Marshal]::Copy($lock.Scan0, $bytes, 0, $bytes.Length)

  $visited = New-Object bool[] ($w * $h)
  $stack = New-Object System.Collections.Generic.Stack[int]

  $isBackdrop = {
    param([int]$x, [int]$y)
    if ($x -lt 0 -or $y -lt 0 -or $x -ge $w -or $y -ge $h) { return $true }
    $i = $y * $stride + $x * 4
    $a = $bytes[$i + 3]
    if ($a -lt 16) { return $true }
    $b = $bytes[$i]; $g = $bytes[$i + 1]; $r = $bytes[$i + 2]
    return ($r -ge 230 -and $g -ge 230 -and $b -ge 230)
  }

  for ($x = 0; $x -lt $w; $x++) {
    foreach ($y in @(0, ($h - 1))) {
      $p = $y * $w + $x
      if (-not $visited[$p] -and (& $isBackdrop $x $y)) {
        $visited[$p] = $true
        $stack.Push($p)
      }
    }
  }
  for ($y = 0; $y -lt $h; $y++) {
    foreach ($x in @(0, ($w - 1))) {
      $p = $y * $w + $x
      if (-not $visited[$p] -and (& $isBackdrop $x $y)) {
        $visited[$p] = $true
        $stack.Push($p)
      }
    }
  }

  while ($stack.Count -gt 0) {
    $p = $stack.Pop()
    $x = $p % $w
    $y = [int][Math]::Floor($p / $w)
    $i = $y * $stride + $x * 4
    if ($i -ge 0 -and ($i + 3) -lt $bytes.Length) {
      $bytes[$i] = 0; $bytes[$i + 1] = 0; $bytes[$i + 2] = 0; $bytes[$i + 3] = 0
    }
    foreach ($d in @(@(1, 0), @(-1, 0), @(0, 1), @(0, -1))) {
      $nx = $x + $d[0]; $ny = $y + $d[1]
      if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $w -or $ny -ge $h) { continue }
      $np = $ny * $w + $nx
      if ($visited[$np]) { continue }
      $visited[$np] = $true
      if (& $isBackdrop $nx $ny) { $stack.Push($np) }
    }
  }

  for ($pass = 0; $pass -lt 3; $pass++) {
    $kill = New-Object System.Collections.Generic.List[int]
    for ($y = 0; $y -lt $h; $y++) {
      for ($x = 0; $x -lt $w; $x++) {
        $i = $y * $stride + $x * 4
        $a = $bytes[$i + 3]
        if ($a -lt 16) { continue }
        $b = $bytes[$i]; $g = $bytes[$i + 1]; $r = $bytes[$i + 2]
        if (-not ($r -ge 176 -and $g -ge 176 -and $b -ge 176)) { continue }
        $open = $false
        foreach ($d in @(@(-1,0),@(1,0),@(0,-1),@(0,1),@(-1,-1),@(1,-1),@(-1,1),@(1,1))) {
          $nx = $x + $d[0]; $ny = $y + $d[1]
          if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $w -or $ny -ge $h) { $open = $true; break }
          if ($bytes[$ny * $stride + $nx * 4 + 3] -lt 16) { $open = $true; break }
        }
        if ($open -or $a -lt 96) { $kill.Add($i) }
      }
    }
    foreach ($i in $kill) {
      $bytes[$i] = 0; $bytes[$i + 1] = 0; $bytes[$i + 2] = 0; $bytes[$i + 3] = 0
    }
  }

  $kill = New-Object System.Collections.Generic.List[int]
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $i = $y * $stride + $x * 4
      if ($bytes[$i + 3] -lt 16) { continue }
      $b = $bytes[$i]; $g = $bytes[$i + 1]; $r = $bytes[$i + 2]
      $max = [Math]::Max($r, [Math]::Max($g, $b))
      $min = [Math]::Min($r, [Math]::Min($g, $b))
      if ($max -lt 105) { continue }
      if (($max - $min) -gt ($max * 0.22)) { continue }
      $luma = ($r + $g + $b) / 3
      $open = $false
      $darker = $false
      foreach ($d in @(@(-1,0),@(1,0),@(0,-1),@(0,1))) {
        $nx = $x + $d[0]; $ny = $y + $d[1]
        if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $w -or $ny -ge $h) { $open = $true; continue }
        $ni = $ny * $stride + $nx * 4
        if ($bytes[$ni + 3] -lt 16) { $open = $true; continue }
        $nluma = ($bytes[$ni + 2] + $bytes[$ni + 1] + $bytes[$ni]) / 3
        if ($nluma -lt ($luma - 24)) { $darker = $true }
      }
      if ($open -and $darker) { $kill.Add($i) }
    }
  }
  foreach ($i in $kill) {
    $bytes[$i] = 0; $bytes[$i + 1] = 0; $bytes[$i + 2] = 0; $bytes[$i + 3] = 0
  }

  $copy = [byte[]]::new($bytes.Length)
  [Array]::Copy($bytes, $copy, $bytes.Length)
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $i = $y * $stride + $x * 4
      if ($copy[$i + 3] -lt 16) { continue }
      $bb = $copy[$i]; $gg = $copy[$i + 1]; $rr = $copy[$i + 2]
      $max = [Math]::Max($rr, [Math]::Max($gg, $bb))
      $min = [Math]::Min($rr, [Math]::Min($gg, $bb))
      $luma = ($rr + $gg + $bb) / 3
      if ($luma -lt 120) { continue }
      if (($max - $min) -gt [Math]::Max(18, $max * 0.2)) { continue }
      $open = $false
      $best = -1
      $bestLuma = $luma
      foreach ($d in @(@(-1,0),@(1,0),@(0,-1),@(0,1),@(-1,-1),@(1,-1),@(-1,1),@(1,1))) {
        $nx = $x + $d[0]; $ny = $y + $d[1]
        if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $w -or $ny -ge $h) { $open = $true; continue }
        $ni = $ny * $stride + $nx * 4
        if ($copy[$ni + 3] -lt 16) { $open = $true; continue }
        $nluma = ($copy[$ni + 2] + $copy[$ni + 1] + $copy[$ni]) / 3
        if ($nluma -lt ($bestLuma - 16)) { $bestLuma = $nluma; $best = $ni }
      }
      if (-not $open) { continue }
      if ($best -ge 0) {
        $bytes[$i] = $copy[$best]
        $bytes[$i + 1] = $copy[$best + 1]
        $bytes[$i + 2] = $copy[$best + 2]
      } elseif ($luma -ge 176) {
        $bytes[$i] = 0; $bytes[$i + 1] = 0; $bytes[$i + 2] = 0; $bytes[$i + 3] = 0
      }
    }
  }

  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $lock.Scan0, $bytes.Length)
  $bmp.UnlockBits($lock)
}

function Alpha-Box([System.Drawing.Bitmap]$bmp) {
  $w = $bmp.Width; $h = $bmp.Height
  $minX = $w; $minY = $h; $maxX = -1; $maxY = -1
  $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
  $lock = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $lock.Stride
  $bytes = New-Object byte[] ($stride * $h)
  [System.Runtime.InteropServices.Marshal]::Copy($lock.Scan0, $bytes, 0, $bytes.Length)
  $bmp.UnlockBits($lock)
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      if ($bytes[$y * $stride + $x * 4 + 3] -lt 16) { continue }
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
  if ($maxX -lt 0) { return $null }
  return @{ x = $minX; y = $minY; w = ($maxX - $minX + 1); h = ($maxY - $minY + 1) }
}

foreach ($id in $ids) {
  $src = Join-Path $root "public\sprites\$id\idle\001.png"
  if (-not (Test-Path $src)) {
    Write-Output "skip $id (missing idle)"
    continue
  }
  $loaded = New-Object System.Drawing.Bitmap($src)
  $bmp = $loaded
  if ($loaded.PixelFormat -ne [System.Drawing.Imaging.PixelFormat]::Format32bppArgb) {
    $bmp = New-Object System.Drawing.Bitmap($loaded.Width, $loaded.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $cg = [System.Drawing.Graphics]::FromImage($bmp)
    $cg.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $cg.DrawImage($loaded, 0, 0, $loaded.Width, $loaded.Height)
    $cg.Dispose()
    $loaded.Dispose()
  }
  Punch-Bmp $bmp
  $box = Alpha-Box $bmp
  if ($null -eq $box) {
    Write-Output "skip $id (empty after punch)"
    $bmp.Dispose()
    continue
  }
  $art = New-Object System.Drawing.Bitmap($box.w, $box.h)
  $g = [System.Drawing.Graphics]::FromImage($art)
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  $g.DrawImage($bmp, (New-Object System.Drawing.Rectangle(0, 0, $box.w, $box.h)), (New-Object System.Drawing.Rectangle($box.x, $box.y, $box.w, $box.h)), [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $art.Save((Join-Path $out "${id}_art.png"), [System.Drawing.Imaging.ImageFormat]::Png)

  $side = [Math]::Max([int]($box.h * 0.42), [int]($box.w * 0.72))
  $side = [Math]::Max(64, $side)
  $hx = [Math]::Max(0, [int]($art.Width / 2) - [int]($side / 2))
  if ($hx + $side -gt $art.Width) { $side = [Math]::Min($side, $art.Width); $hx = [Math]::Max(0, $art.Width - $side) }
  $side = [Math]::Min($side, $art.Height)
  $head = New-Object System.Drawing.Bitmap($side, $side)
  $hg = [System.Drawing.Graphics]::FromImage($head)
  $hg.Clear([System.Drawing.Color]::FromArgb(255, 16, 32, 48))
  $hg.DrawImage($art, (New-Object System.Drawing.Rectangle(0, 0, $side, $side)), (New-Object System.Drawing.Rectangle($hx, 0, $side, $side)), [System.Drawing.GraphicsUnit]::Pixel)
  $hg.Dispose()
  $head.Save((Join-Path $out "${id}_head.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $head.Dispose(); $art.Dispose(); $bmp.Dispose()
  Write-Output "cleaned $id"
}
