$out = "d:\Projects\LungVaiTea\handoff_deployment_full.png"
$html = "file:///d:/Projects/LungVaiTea/handoff-infographic.html"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

$args = @(
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--screenshot=$out",
    "--window-size=1200,2920",
    $html
)

Start-Process -FilePath $edge -ArgumentList $args -Wait

if (Test-Path $out) {
    $item = Get-Item $out
    Add-Type -AssemblyName System.Drawing
    $img = [System.Drawing.Bitmap]::FromFile($out)
    Write-Output "SUCCESS: $($item.FullName) ($($item.Length) bytes) Dimensions: $($img.Width)x$($img.Height)"
    
    # Check bottom-most non-background pixel
    # Background color is #0b1320 (R: 11, G: 19, B: 32)
    $lastY = 0
    for ($y = $img.Height - 1; $y -ge 0; $y--) {
        $hasContent = $false
        for ($x = 50; $x -lt $img.Width - 50; $x += 20) {
            $p = $img.GetPixel($x, $y)
            if ($p.R -gt 25 -or $p.G -gt 35 -or $p.B -gt 50) {
                $hasContent = $true
                break
            }
        }
        if ($hasContent) {
            $lastY = $y
            break
        }
    }
    Write-Output "Content bottom is at y=$lastY (Total height: $($img.Height))"
    $img.Dispose()
} else {
    Write-Output "FAILED: Output file not created"
}
