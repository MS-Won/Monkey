Add-Type -AssemblyName System.Drawing

# Holographic canvas + holo-violet mascot (frontend/src/theme/colors.ts와 동기화)
$navy = [System.Drawing.ColorTranslator]::FromHtml('#0D0A1F')
$gold = [System.Drawing.ColorTranslator]::FromHtml('#C9A2FF')

$targets = @(
    @{ Folder = 'mipmap-mdpi';    Size = 48 },
    @{ Folder = 'mipmap-hdpi';    Size = 72 },
    @{ Folder = 'mipmap-xhdpi';   Size = 96 },
    @{ Folder = 'mipmap-xxhdpi';  Size = 144 },
    @{ Folder = 'mipmap-xxxhdpi'; Size = 192 }
)

$resRoot = "D:\00 My Project\01 Monkey\android\app\src\main\res"

foreach ($t in $targets) {
    $size = [double]$t.Size
    $unit = $size / 108.0
    $bmp = New-Object System.Drawing.Bitmap([int]$t.Size, [int]$t.Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear($navy)

    $penThick = New-Object System.Drawing.Pen($gold, [Math]::Max(1.5, 2.8 * $unit))
    $penMed   = New-Object System.Drawing.Pen($gold, [Math]::Max(1.2, 2.2 * $unit))
    $penThin  = New-Object System.Drawing.Pen($gold, [Math]::Max(1.0, 2.0 * $unit))
    $penThin.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penThin.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $brush = New-Object System.Drawing.SolidBrush($gold)

    # ears
    $g.DrawEllipse($penMed, [single](28.5 * $unit), [single](39.5 * $unit), [single](15 * $unit), [single](15 * $unit))
    $g.DrawEllipse($penMed, [single](64.5 * $unit), [single](39.5 * $unit), [single](15 * $unit), [single](15 * $unit))
    # head
    $g.DrawEllipse($penThick, [single](35 * $unit), [single](39 * $unit), [single](38 * $unit), [single](38 * $unit))
    # face patch
    $g.DrawEllipse($penMed, [single](42.5 * $unit), [single](52.5 * $unit), [single](23 * $unit), [single](19 * $unit))
    # eyes
    $g.FillEllipse($brush, [single](46.6 * $unit), [single](55.1 * $unit), [single](3.8 * $unit), [single](3.8 * $unit))
    $g.FillEllipse($brush, [single](57.6 * $unit), [single](55.1 * $unit), [single](3.8 * $unit), [single](3.8 * $unit))
    # nose
    $g.FillEllipse($brush, [single](52.8 * $unit), [single](61.3 * $unit), [single](2.4 * $unit), [single](2.4 * $unit))

    # smile (through-points curve)
    $smile = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF([single](47.5 * $unit), [single](67 * $unit))),
        (New-Object System.Drawing.PointF([single](54 * $unit), [single](72 * $unit))),
        (New-Object System.Drawing.PointF([single](60.5 * $unit), [single](67 * $unit)))
    )
    $g.DrawCurve($penThin, $smile)

    # hair tuft
    $tuft = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF([single](49 * $unit), [single](40 * $unit))),
        (New-Object System.Drawing.PointF([single](54 * $unit), [single](35 * $unit))),
        (New-Object System.Drawing.PointF([single](59 * $unit), [single](40 * $unit)))
    )
    $g.DrawCurve($penThin, $tuft)

    $g.Dispose()

    $dir = Join-Path $resRoot $t.Folder
    $outSquare = Join-Path $dir 'ic_launcher.png'
    $outRound = Join-Path $dir 'ic_launcher_round.png'
    $bmp.Save($outSquare, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save($outRound, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Wrote $outSquare and $outRound ($($t.Size) x $($t.Size))"
}
