Add-Type -AssemblyName System.Drawing

# 새 원숭이 점술가 아이콘(docs/release/store-assets/icon.png)을
#  - Android 런처 아이콘(각 해상도 mipmap PNG, square + round)
#  - 인앱 캐릭터 이미지(frontend/assets/images/mascot.png)
#  - 스토어 512 아이콘(docs/release/store-assets/icon-512.png)
# 로 변환/설치한다. 고품질 리샘플.

$src = "D:\00 My Project\01 Monkey\docs\release\store-assets\icon.png"
$resRoot = "D:\00 My Project\01 Monkey\android\app\src\main\res"
$assetsImg = "D:\00 My Project\01 Monkey\frontend\assets\images"

$orig = [System.Drawing.Image]::FromFile($src)

function Resize-Square {
    param([int]$size)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($orig, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)))
    $g.Dispose()
    return $bmp
}

function Resize-Round {
    param([int]$size)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $g.SetClip($path)
    $g.DrawImage($orig, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)))
    $g.Dispose(); $path.Dispose()
    return $bmp
}

# --- Android 런처 mipmap ---
$targets = @(
    @{ Folder = 'mipmap-mdpi';    Size = 48 },
    @{ Folder = 'mipmap-hdpi';    Size = 72 },
    @{ Folder = 'mipmap-xhdpi';   Size = 96 },
    @{ Folder = 'mipmap-xxhdpi';  Size = 144 },
    @{ Folder = 'mipmap-xxxhdpi'; Size = 192 }
)
foreach ($t in $targets) {
    $dir = Join-Path $resRoot $t.Folder
    $sq = Resize-Square -size $t.Size
    $sq.Save((Join-Path $dir 'ic_launcher.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $sq.Dispose()
    $rd = Resize-Round -size $t.Size
    $rd.Save((Join-Path $dir 'ic_launcher_round.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $rd.Dispose()
    Write-Output "launcher $($t.Folder) $($t.Size)px (square+round)"
}

# --- 인앱 캐릭터 이미지 (512 square) ---
New-Item -ItemType Directory -Force -Path $assetsImg | Out-Null
$inapp = Resize-Square -size 512
$inapp.Save((Join-Path $assetsImg 'mascot.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$inapp.Dispose()
Write-Output "in-app mascot.png (512)"

# --- 스토어 512 아이콘 ---
$store = Resize-Square -size 512
$store.Save("D:\00 My Project\01 Monkey\docs\release\store-assets\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$store.Dispose()
Write-Output "store icon-512.png"

$orig.Dispose()
Write-Output "DONE"
