Add-Type -AssemblyName System.Data
$connStr = 'Server=localhost\SQLEXPRESS;Database=seeme-web;Trusted_Connection=True;TrustServerCertificate=True;'
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

$tables = @('Gardens', 'Teas', 'Products', 'TeaGroups')
foreach ($t in $tables) {
    Write-Host "=== Table: $t ==="
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$t' AND COLUMN_NAME LIKE '%En%'"
    $reader = $cmd.ExecuteReader()
    $hasAny = $false
    while ($reader.Read()) {
        Write-Host $reader['COLUMN_NAME']
        $hasAny = $true
    }
    if (-not $hasAny) { Write-Host "(No En columns)" }
    $reader.Close()
}
$conn.Close()
