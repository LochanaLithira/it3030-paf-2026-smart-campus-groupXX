$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8080/api/v1'

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [hashtable]$Headers = @{}
  )
  try {
    if ($Body -ne $null) {
      $json = $Body | ConvertTo-Json -Depth 10
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $Url -Method $Method -Headers $Headers -ContentType 'application/json' -Body $json
    } else {
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $Url -Method $Method -Headers $Headers
    }
    return [pscustomobject]@{ status = [int]$resp.StatusCode; body = $resp.Content }
  } catch {
    $r = $_.Exception.Response
    if ($r -and $r.StatusCode) {
      $code = [int]$r.StatusCode
      $reader = New-Object System.IO.StreamReader($r.GetResponseStream())
      $content = $reader.ReadToEnd()
      return [pscustomobject]@{ status = $code; body = $content }
    }
    return [pscustomobject]@{ status = -1; body = $_.Exception.Message }
  }
}

$login = Invoke-Api -Method 'POST' -Url "$base/auth/login" -Body @{ email='admin@smartcampus.com'; password='Admin@123' }
if ($login.status -ne 200) {
  Write-Output ('LOGIN_FAIL|' + $login.status + '|' + $login.body)
  exit 1
}

$token = (($login.body | ConvertFrom-Json).accessToken)
$headers = @{ Authorization = ('Bearer ' + $token) }
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$building = 'Smoke-' + $stamp
$cases = @()

$a = Invoke-Api -Method 'POST' -Url "$base/locations" -Headers $headers -Body @{
  buildingName = $building
  floorNumber = 1
  roomNumber = '101'
  description = 'smoke valid location'
}
$locId = $null
if ($a.status -eq 201) { $locId = (($a.body | ConvertFrom-Json).locationId) }
$cases += [pscustomobject]@{ Case='Location valid'; Expected='201'; Actual=$a.status; Pass=($a.status -eq 201) }

$b = Invoke-Api -Method 'POST' -Url "$base/locations" -Headers $headers -Body @{
  buildingName = $building
  floorNumber = 1
  roomNumber = '101'
  description = 'smoke duplicate'
}
$cases += [pscustomobject]@{ Case='Location duplicate composite key'; Expected='409'; Actual=$b.status; Pass=($b.status -eq 409) }

$c = Invoke-Api -Method 'POST' -Url "$base/resources" -Headers $headers -Body @{
  name = ('SmokeResource-NoLoc-' + $stamp)
  type = 'LAB'
  capacity = 20
  status = 'ACTIVE'
  description = 'smoke no location'
  tagIds = @()
  availability = @()
}
$cases += [pscustomobject]@{ Case='Resource valid no location'; Expected='201'; Actual=$c.status; Pass=($c.status -eq 201) }

if ($locId) {
  $d = Invoke-Api -Method 'POST' -Url "$base/resources" -Headers $headers -Body @{
    name = ('SmokeResource-WithLoc-' + $stamp)
    type = 'LECTURE_HALL'
    capacity = 50
    locationId = $locId
    status = 'ACTIVE'
    description = 'smoke with location'
    tagIds = @()
    availability = @(@{ dayOfWeek='MON'; startTime='08:00:00'; endTime='10:00:00' })
  }
  $cases += [pscustomobject]@{ Case='Resource valid with location+availability'; Expected='201'; Actual=$d.status; Pass=($d.status -eq 201) }
}

$e = Invoke-Api -Method 'POST' -Url "$base/resources" -Headers $headers -Body @{
  name = ('SmokeResource-BadLoc-' + $stamp)
  type = 'LAB'
  capacity = 10
  locationId = '11111111-1111-1111-1111-111111111111'
  status = 'ACTIVE'
  tagIds = @()
  availability = @()
}
$cases += [pscustomobject]@{ Case='Resource invalid locationId'; Expected='400 or 404'; Actual=$e.status; Pass=($e.status -in @(400,404)) }

$f = Invoke-Api -Method 'POST' -Url "$base/resources" -Headers $headers -Body @{
  name = ('SmokeResource-BadTime-' + $stamp)
  type = 'LAB'
  capacity = 10
  status = 'ACTIVE'
  tagIds = @()
  availability = @(@{ dayOfWeek='TUE'; startTime='10:00:00'; endTime='09:00:00' })
}
$cases += [pscustomobject]@{ Case='Resource invalid availability time order'; Expected='422'; Actual=$f.status; Pass=($f.status -eq 422) }

$cases | ConvertTo-Json -Depth 4
