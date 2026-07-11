Add-Type -AssemblyName System.Drawing

# Play Store 그래픽 에셋 생성 (앱 스플래시/홀로그래픽 톤 반영)
#  - 512x512 앱 아이콘
#  - 1024x500 피처 그래픽
# 색상은 frontend/src/theme/colors.ts 와 동기화

$navy    = [System.Drawing.ColorTranslator]::FromHtml('#0D0A1F')
$violet  = [System.Drawing.ColorTranslator]::FromHtml('#7C3AED')
$holo    = [System.Drawing.ColorTranslator]::FromHtml('#C9A2FF')
$magenta = [System.Drawing.ColorTranslator]::FromHtml('#D98CFF')
$teal    = [System.Drawing.ColorTranslator]::FromHtml('#123536')
$ivory   = [System.Drawing.ColorTranslator]::FromHtml('#F3EFFB')

$outDir = "D:\00 My Project\01 Monkey\docs\release\store-assets"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# 마스코트(원숭이/돼지 라인아트)를 주어진 Graphics에 그린다.
# cx,cy = 마스코트 중심 위치(px), scale = 108-grid 대비 px/unit
function Draw-Mascot {
    param($g, [double]$cx, [double]$cy, [double]$scale, [System.Drawing.Color]$color)
    $u = $scale
    # 108-grid 기준 마스코트 중심 ≈ (54, 56). 그 중심이 (cx,cy)에 오도록 오프셋.
    $ox = $cx - (54.0 * $u)
    $oy = $cy - (56.0 * $u)
    $penThick = New-Object System.Drawing.Pen($color, [single][Math]::Max(2.0, 2.8 * $u))
    $penMed   = New-Object System.Drawing.Pen($color, [single][Math]::Max(1.6, 2.2 * $u))
    $penThin  = New-Object System.Drawing.Pen($color, [single][Math]::Max(1.4, 2.0 * $u))
    $penThin.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penThin.EndCap   = [System.Drawing.Drawing2D.LineCap]::Round
    $penThick.StartCap = [System.Drawing.Drawing2D.LineCap]::Round; $penThick.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $brush = New-Object System.Drawing.SolidBrush($color)

    # ears
    $g.DrawEllipse($penMed, [single]($ox + 28.5*$u), [single]($oy + 39.5*$u), [single](15*$u), [single](15*$u))
    $g.DrawEllipse($penMed, [single]($ox + 64.5*$u), [single]($oy + 39.5*$u), [single](15*$u), [single](15*$u))
    # head
    $g.DrawEllipse($penThick, [single]($ox + 35*$u), [single]($oy + 39*$u), [single](38*$u), [single](38*$u))
    # face patch
    $g.DrawEllipse($penMed, [single]($ox + 42.5*$u), [single]($oy + 52.5*$u), [single](23*$u), [single](19*$u))
    # eyes
    $g.FillEllipse($brush, [single]($ox + 46.6*$u), [single]($oy + 55.1*$u), [single](3.8*$u), [single](3.8*$u))
    $g.FillEllipse($brush, [single]($ox + 57.6*$u), [single]($oy + 55.1*$u), [single](3.8*$u), [single](3.8*$u))
    # nose
    $g.FillEllipse($brush, [single]($ox + 52.8*$u), [single]($oy + 61.3*$u), [single](2.4*$u), [single](2.4*$u))
    # smile
    $smile = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF([single]($ox + 47.5*$u), [single]($oy + 67*$u))),
        (New-Object System.Drawing.PointF([single]($ox + 54*$u),   [single]($oy + 72*$u))),
        (New-Object System.Drawing.PointF([single]($ox + 60.5*$u), [single]($oy + 67*$u)))
    )
    $g.DrawCurve($penThin, $smile)
    # hair tuft
    $tuft = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF([single]($ox + 49*$u), [single]($oy + 40*$u))),
        (New-Object System.Drawing.PointF([single]($ox + 54*$u), [single]($oy + 35*$u))),
        (New-Object System.Drawing.PointF([single]($ox + 59*$u), [single]($oy + 40*$u)))
    )
    $g.DrawCurve($penThin, $tuft)
    $penThick.Dispose(); $penMed.Dispose(); $penThin.Dispose(); $brush.Dispose()
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

# ---------- 1) 512x512 아이콘 ----------
$S = 512
$bmp = New-Object System.Drawing.Bitmap($S, $S)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear($navy)
# 은은한 오로라 글로우 (좌상 보라 / 우하 마젠타)
Draw-Glow $g ($S*0.32) ($S*0.30) ($S*0.55) $violet 150
Draw-Glow $g ($S*0.72) ($S*0.74) ($S*0.50) $magenta 90
# 중앙 헤일로 링
$ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, $holo.R, $holo.G, $holo.B), 2.0)
$g.DrawEllipse($ringPen, [single]($S*0.5 - $S*0.30), [single]($S*0.5 - $S*0.30), [single]($S*0.60), [single]($S*0.60))
$ringPen.Dispose()
# 마스코트(중앙, 108-grid를 캔버스의 ~68% 크기로)
$scale512 = ($S * 0.66) / 108.0
Draw-Mascot $g ($S*0.5) ($S*0.5) $scale512 $holo
$g.Dispose()
$iconPath = Join-Path $outDir 'icon-512.png'
$bmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "Wrote $iconPath (512x512)"

# ---------- 2) 1024x500 피처 그래픽 ----------
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
# 마스코트 (좌측)
$mScale = ($H * 0.62) / 108.0
$mcx = $W * 0.20; $mcy = $H * 0.50
Draw-Glow $fg $mcx $mcy ($H*0.34) $holo 80
Draw-Mascot $fg $mcx $mcy $mScale $holo
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
Write-Output "Wrote $featPath (1024x500)"
