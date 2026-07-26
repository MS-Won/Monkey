Add-Type -AssemblyName System.Drawing

# Play Store 그래픽 에셋 생성 (앱 스플래시/홀로그래픽 톤 반영)
#  - 1024x500 피처 그래픽
# 색상은 frontend/src/theme/colors.ts 와 동기화
#
# [2026-07-26] 마스코트를 옛 라인아트 벡터 → 실제 앱 아이콘 일러스트(icon.png)로 교체.
#   이전 버전은 Draw-Mascot()으로 원숭이를 코드로 그렸는데, 앱 아이콘이 원숭이 점술가
#   일러스트로 바뀐 뒤에도 피처 그래픽만 옛 라인아트로 남아 "원숭이가 두 종류"인 상태였음.
# [2026-07-26] 512 아이콘 생성 코드 제거: `apply-monkey-icon.ps1`이 icon.png에서
#   icon-512.png를 만드는 단일 소유자다. 여기서 다시 만들면 좋은 아이콘을 덮어쓴다.

$navy    = [System.Drawing.ColorTranslator]::FromHtml('#0D0A1F')
$violet  = [System.Drawing.ColorTranslator]::FromHtml('#7C3AED')
$holo    = [System.Drawing.ColorTranslator]::FromHtml('#C9A2FF')
$magenta = [System.Drawing.ColorTranslator]::FromHtml('#D98CFF')
$teal    = [System.Drawing.ColorTranslator]::FromHtml('#123536')
$ivory   = [System.Drawing.ColorTranslator]::FromHtml('#F3EFFB')

$outDir = "D:\00 My Project\01 Monkey\docs\release\store-assets"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# 앱 아이콘과 동일한 원숭이 점술가 일러스트. apply-monkey-icon.ps1과 같은 원본/크롭값을 쓴다.
$iconSrc  = "D:\00 My Project\01 Monkey\docs\release\store-assets\icon.png"
$iconOrig = [System.Drawing.Image]::FromFile($iconSrc)
# 원본 icon.png 바깥의 흰 라운드 프레임을 잘라내는 비율(apply-monkey-icon.ps1과 동일해야 함).
$SRC_CROP = 0.075

# 일러스트를 둥근 사각형으로 클립해 (cx,cy) 중심, 한 변 $size 로 그린다.
function Draw-MonkeyIcon {
    param($g, [double]$cx, [double]$cy, [double]$size)
    $x = $cx - $size / 2.0
    $y = $cy - $size / 2.0
    $rad = [double]($size * 0.17)   # splash_logo와 동일한 라운드 비율
    $d = [double](2 * $rad)
    $rp = New-Object System.Drawing.Drawing2D.GraphicsPath
    $rp.AddArc([single]$x, [single]$y, [single]$d, [single]$d, 180, 90)
    $rp.AddArc([single]($x + $size - $d), [single]$y, [single]$d, [single]$d, 270, 90)
    $rp.AddArc([single]($x + $size - $d), [single]($y + $size - $d), [single]$d, [single]$d, 0, 90)
    $rp.AddArc([single]$x, [single]($y + $size - $d), [single]$d, [single]$d, 90, 90)
    $rp.CloseFigure()

    $old = $g.Clip
    $g.SetClip($rp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $sw = $iconOrig.Width; $sh = $iconOrig.Height
    $sx = [single]($sw * $SRC_CROP); $sy = [single]($sh * $SRC_CROP)
    $swi = [single]($sw * (1.0 - 2.0 * $SRC_CROP)); $shi = [single]($sh * (1.0 - 2.0 * $SRC_CROP))
    $dest = New-Object System.Drawing.Rectangle([int]$x, [int]$y, [int]$size, [int]$size)
    $g.DrawImage($iconOrig, $dest, $sx, $sy, $swi, $shi, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Clip = $old
    $rp.Dispose()
}

# 중심 발광(radial glow) 그리기
function Draw-Glow {
    param($g, [double]$cx, [double]$cy, [double]$radius, [System.Drawing.Color]$color, [int]$centerAlpha)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse([single]($cx-$radius), [single]($cy-$radius), [single]($radius*2), [single]($radius*2))
    $pgb = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
    $pgb.CenterPoint = New-Object System.Drawing.PointF([single]$cx, [single]$cy)
    $pgb.CenterColor = [System.Drawing.Color]::FromArgb($centerAlpha, $color.R, $color.G, $color.B)
    $pgb.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $color.R, $color.G, $color.B))
    $g.FillPath($pgb, $path)
    $pgb.Dispose(); $path.Dispose()
}

# ---------- 512x512 아이콘: 여기서 만들지 않음 ----------
# icon-512.png는 `scripts/apply-monkey-icon.ps1`이 icon.png에서 생성한다(단일 소유자).
# 이 스크립트에서 다시 만들면 원숭이 점술가 아이콘을 옛 라인아트로 덮어쓰게 된다.

# ---------- 1024x500 피처 그래픽 ----------
$W = 1024; $H = 500
$fb = New-Object System.Drawing.Bitmap($W, $H)
$fg = [System.Drawing.Graphics]::FromImage($fb)
$fg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$fg.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
# 대각 그라디언트 배경 (인디고 → 딥바이올렛 → 틸)
$rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
$lgb = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $navy, $teal, [single]25.0)
$cb = New-Object System.Drawing.Drawing2D.ColorBlend(3)
$cb.Colors = @($navy, ([System.Drawing.ColorTranslator]::FromHtml('#241640')), $teal)
$cb.Positions = @([single]0.0, [single]0.55, [single]1.0)
$lgb.InterpolationColors = $cb
$fg.FillRectangle($lgb, $rect)
$lgb.Dispose()
# 오로라 블롭
Draw-Glow $fg ($W*0.30) ($H*0.28) ($H*0.85) $violet 130
Draw-Glow $fg ($W*0.20) ($H*0.85) ($H*0.70) $magenta 70
Draw-Glow $fg ($W*0.78) ($H*0.30) ($H*0.60) ([System.Drawing.ColorTranslator]::FromHtml('#3AA0B0')) 60
# 마스코트 (좌측) — 앱 아이콘과 동일한 원숭이 점술가 일러스트
$mSize = $H * 0.66
$mcx = $W * 0.20; $mcy = $H * 0.50
Draw-Glow $fg $mcx $mcy ($H*0.42) $holo 90
Draw-MonkeyIcon $fg $mcx $mcy $mSize
# 텍스트 (우측)
$titleFont = New-Object System.Drawing.Font('Georgia', 82, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$tagFont   = New-Object System.Drawing.Font('Malgun Gothic', 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$subFont   = New-Object System.Drawing.Font('Malgun Gothic', 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$ivoryBrush  = New-Object System.Drawing.SolidBrush($ivory)
$holoBrush   = New-Object System.Drawing.SolidBrush($holo)
$mutedBrush  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, $holo.R, $holo.G, $holo.B))
$tx = $W * 0.40
$fg.DrawString('Monkey', $titleFont, $ivoryBrush, [single]$tx, [single]($H*0.30))
$fg.DrawString('꿈을 풀다', $tagFont, $holoBrush, [single]($tx+4), [single]($H*0.52))
$fg.DrawString('전통 해몽 · 꿈 일기 · 아르누보 카드', $subFont, $mutedBrush, [single]($tx+4), [single]($H*0.66))
$titleFont.Dispose(); $tagFont.Dispose(); $subFont.Dispose()
$ivoryBrush.Dispose(); $holoBrush.Dispose(); $mutedBrush.Dispose()
$fg.Dispose()
$featPath = Join-Path $outDir 'feature-graphic-1024x500.png'
$fb.Save($featPath, [System.Drawing.Imaging.ImageFormat]::Png)
$fb.Dispose()
$iconOrig.Dispose()
Write-Output "Wrote $featPath (1024x500)"
