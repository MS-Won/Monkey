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

# 딥 인디고(앱 배경색, values/colors.xml ic_launcher_background와 동기화)
$navy = [System.Drawing.ColorTranslator]::FromHtml('#0D0A1F')
# 런처 아이콘 인셋: 일러스트를 이 비율로 축소해 인디고 위에 중앙 합성.
# 어댑티브 마스크(원형/스퀘어클)에 핵심(원숭이+볼)이 잘리지 않도록 여백 확보하되,
# 타일을 인디고로 꽉 채워 크림 링 없이 "꽉찬" 느낌. 육안 튜닝값.
# 일러스트를 캔버스의 이 비율로(중앙) 채운다. 1.0=풀블리드.
$INSET = 1.0
# 원본 icon.png 바깥의 흰 라운드 프레임을 제거하려고 각 변에서 잘라내는 비율.
# 크롭 후엔 어두운 밤하늘만 남아 인디고와 이어져 "꽉찬" 다크 아이콘이 된다.
$SRC_CROP = 0.075

# 인디고 캔버스에, 원본에서 흰 프레임을 크롭한 영역을 $scale 비율로 중앙 합성(정사각, 불투명)
function Compose-Square {
    param([int]$size, [double]$scale)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear($navy)
    $inner = [int]([Math]::Round($size * $scale))
    $off = [int]([Math]::Round(($size - $inner) / 2.0))
    # 원본에서 흰 프레임을 뺀 안쪽 영역(src)만 dest에 그린다.
    $sw = $orig.Width; $sh = $orig.Height
    $sx = [single]($sw * $SRC_CROP); $sy = [single]($sh * $SRC_CROP)
    $swi = [single]($sw * (1.0 - 2.0 * $SRC_CROP)); $shi = [single]($sh * (1.0 - 2.0 * $SRC_CROP))
    $destRect = New-Object System.Drawing.Rectangle($off, $off, $inner, $inner)
    # DrawImage(Image, Rectangle dest, single srcX, srcY, srcW, srcH, GraphicsUnit)
    $g.DrawImage($orig, $destRect, $sx, $sy, $swi, $shi, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    return $bmp
}

# 위 합성본을 원형으로 크롭(레거시 round 아이콘용)
function Compose-Round {
    param([int]$size, [double]$scale)
    $src = Compose-Square -size $size -scale $scale
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $g.SetClip($path)
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose(); $path.Dispose(); $src.Dispose()
    return $bmp
}

# --- Android 레거시 런처 mipmap (48~192, 폴백) ---
$targets = @(
    @{ Folder = 'mipmap-mdpi';    Size = 48 },
    @{ Folder = 'mipmap-hdpi';    Size = 72 },
    @{ Folder = 'mipmap-xhdpi';   Size = 96 },
    @{ Folder = 'mipmap-xxhdpi';  Size = 144 },
    @{ Folder = 'mipmap-xxxhdpi'; Size = 192 }
)
foreach ($t in $targets) {
    $dir = Join-Path $resRoot $t.Folder
    $sq = Compose-Square -size $t.Size -scale $INSET
    $sq.Save((Join-Path $dir 'ic_launcher.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $sq.Dispose()
    $rd = Compose-Round -size $t.Size -scale $INSET
    $rd.Save((Join-Path $dir 'ic_launcher_round.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $rd.Dispose()
    Write-Output "legacy $($t.Folder) $($t.Size)px (square+round)"
}

# --- 어댑티브 아이콘 foreground (108dp 기준 각 밀도, 인디고+일러스트 합성 풀블리드) ---
# background는 @color/ic_launcher_background(#0D0A1F), foreground가 실제 그림을 담당.
$fgTargets = @(
    @{ Folder = 'mipmap-mdpi';    Size = 108 },
    @{ Folder = 'mipmap-hdpi';    Size = 162 },
    @{ Folder = 'mipmap-xhdpi';   Size = 216 },
    @{ Folder = 'mipmap-xxhdpi';  Size = 324 },
    @{ Folder = 'mipmap-xxxhdpi'; Size = 432 }
)
foreach ($t in $fgTargets) {
    $dir = Join-Path $resRoot $t.Folder
    # 어댑티브는 108dp 중 바깥 18dp가 마스크로 잘리므로, 108 캔버스에서 일러스트가
    # 안전영역(가운데)에 오도록 $INSET을 그대로 적용.
    $fg = Compose-Square -size $t.Size -scale $INSET
    $fg.Save((Join-Path $dir 'ic_launcher_fg.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $fg.Dispose()
    Write-Output "adaptive-fg $($t.Folder) $($t.Size)px"
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

# --- 네이티브 스플래시 로고 (둥근 모서리, 투명 배경) ---
# splash_background.xml이 중앙에 얹는 마크. 어두운 스플래시 배경 위에 뜨도록 투명 모서리.
$SLOGO = 512
$slog = New-Object System.Drawing.Bitmap($SLOGO, $SLOGO)
$sg = [System.Drawing.Graphics]::FromImage($slog)
$sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$sg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
# 둥근 사각형 클립
$rad = [double]($SLOGO * 0.17)
$d = [double](2 * $rad)
$rp = New-Object System.Drawing.Drawing2D.GraphicsPath
$rp.AddArc(0, 0, $d, $d, 180, 90)
$rp.AddArc($SLOGO - $d, 0, $d, $d, 270, 90)
$rp.AddArc($SLOGO - $d, $SLOGO - $d, $d, $d, 0, 90)
$rp.AddArc(0, $SLOGO - $d, $d, $d, 90, 90)
$rp.CloseFigure()
$sg.SetClip($rp)
# 흰 프레임 크롭한 일러스트를 꽉 차게
$sw = $orig.Width; $sh = $orig.Height
$sx = [single]($sw * $SRC_CROP); $sy = [single]($sh * $SRC_CROP)
$swi = [single]($sw * (1.0 - 2.0 * $SRC_CROP)); $shi = [single]($sh * (1.0 - 2.0 * $SRC_CROP))
$sdest = New-Object System.Drawing.Rectangle(0, 0, $SLOGO, $SLOGO)
$sg.DrawImage($orig, $sdest, $sx, $sy, $swi, $shi, [System.Drawing.GraphicsUnit]::Pixel)
$sg.Dispose(); $rp.Dispose()
$splashPath = Join-Path $resRoot 'drawable\splash_logo.png'
$slog.Save($splashPath, [System.Drawing.Imaging.ImageFormat]::Png)
$slog.Dispose()
Write-Output "splash_logo.png (512, rounded)"

$orig.Dispose()
Write-Output "DONE"
