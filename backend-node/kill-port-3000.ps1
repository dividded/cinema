# Kill all processes using port 3000
Write-Host "Checking for processes using port 3000..." -ForegroundColor Yellow

$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    Write-Host "Found $($pids.Count) process(es) using port 3000:" -ForegroundColor Red
    
    foreach ($pid in $pids) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $pid" -ErrorAction SilentlyContinue).CommandLine
        
        Write-Host "  PID: $pid - $($proc.ProcessName)" -ForegroundColor Cyan
        if ($cmd) {
            $shortCmd = if ($cmd.Length -gt 150) { $cmd.Substring(0, 150) + "..." } else { $cmd }
            Write-Host "    Command: $shortCmd" -ForegroundColor Gray
        }
        
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "    ✓ Killed" -ForegroundColor Green
    }
} else {
    Write-Host "No processes using port 3000" -ForegroundColor Green
}


