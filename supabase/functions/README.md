# Supabase Edge Functions Setup

## Required Environment Variables

The Edge Functions need the following secrets to be set in Supabase Dashboard:

### How to Set Secrets

1. Go to: https://supabase.com/dashboard/project/gyyjviynlwbbodyfmvoi/settings/functions
2. Click "Edge Functions"
3. Add the following secrets:

### Required Secrets

#### `SUPABASE_URL`
**Value:** `https://gyyjviynlwbbodyfmvoi.supabase.co`

This is your Supabase project URL.

#### `SUPABASE_SERVICE_ROLE_KEY`
**Where to find it:**
1. Go to: https://supabase.com/dashboard/project/gyyjviynlwbbodyfmvoi/settings/api
2. Look for "Service Role" key under "Project API keys"
3. Copy the `service_role` secret key (NOT the anon key!)

**⚠️ IMPORTANT:**
- This key has full database access
- Never expose this key to the client-side
- Only use in Edge Functions (server-side)

---

## Deployed Edge Functions

### 1. `timezone-convert`
**URL:** `https://gyyjviynlwbbodyfmvoi.supabase.co/functions/v1/timezone-convert`

Converts UTC timestamps to Eastern Time with automatic DST handling.

**Usage:**
```bash
curl -X POST \
  https://gyyjviynlwbbodyfmvoi.supabase.co/functions/v1/timezone-convert \
  -H "Authorization: Bearer SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamps": ["2025-11-05T14:30:00Z"],
    "toTimezone": "America/New_York"
  }'
```

**Response:**
```json
{
  "conversions": [
    {
      "utc": "2025-11-05T14:30:00Z",
      "local": "2025-11-05T10:30:00-04:00",
      "formatted": "Nov 5, 2025 10:30 AM EDT",
      "timezone": "America/New_York",
      "offset": "-04:00",
      "isDST": true,
      "timezoneName": "EDT"
    }
  ]
}
```

---

### 2. `calculate-payroll`
**URL:** `https://gyyjviynlwbbodyfmvoi.supabase.co/functions/v1/calculate-payroll`

Calculates hours worked and total pay with correct Eastern Time handling.

**Usage:**
```bash
curl -X POST \
  https://gyyjviynlwbbodyfmvoi.supabase.co/functions/v1/calculate-payroll \
  -H "Authorization: Bearer SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "48ae000b-b07a-4d90-8da2-85e85d919dec",
    "startDate": "2025-11-04",
    "endDate": "2025-11-10"
  }'
```

**Response:**
```json
{
  "employeeId": "48ae000b-b07a-4d90-8da2-85e85d919dec",
  "employeeName": "Kelly",
  "startDate": "2025-11-04",
  "endDate": "2025-11-10",
  "timezone": "America/New_York",
  "shifts": [
    {
      "clockIn": "2025-11-05T11:00:00+00:00",
      "clockOut": "2025-11-05T19:30:00+00:00",
      "clockInEST": "Nov 5, 2025 6:00 AM EST",
      "clockOutEST": "Nov 5, 2025 2:30 PM EST",
      "clockInOffset": "-05:00",
      "clockOutOffset": "-05:00",
      "hoursWorked": 8.5
    }
  ],
  "totalHours": 8.5,
  "hourlyRate": 18.00,
  "totalPay": 153.00,
  "unpaired": []
}
```

---

## Deployment

To deploy changes to Edge Functions:

```bash
# Make sure you have SUPABASE_ACCESS_TOKEN set
export SUPABASE_ACCESS_TOKEN=your_token_here

# Deploy timezone-convert
npx supabase functions deploy timezone-convert --project-ref gyyjviynlwbbodyfmvoi

# Deploy calculate-payroll
npx supabase functions deploy calculate-payroll --project-ref gyyjviynlwbbodyfmvoi
```

---

## Testing

Test Edge Functions locally (requires Docker):

```bash
# Start local Supabase
npx supabase start

# Serve functions locally
npx supabase functions serve

# Test in another terminal
curl -X POST http://localhost:54321/functions/v1/timezone-convert \
  -H "Content-Type: application/json" \
  -d '{"timestamps": ["2025-11-05T14:30:00Z"]}'
```

---

## Troubleshooting

### Error: "No auth token provided"
- Make sure environment variables are set in Supabase Dashboard
- Wait a few seconds after setting secrets for them to propagate

### Error: "Missing Supabase environment variables"
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Verify the service role key is correct (not the anon key)

### Error: "Invalid timestamp format"
- Timestamps must be valid ISO 8601 format
- Dates must be YYYY-MM-DD format

### Function returns empty shifts
- Check that employee has clock in/out events in the date range
- Verify dates are in Eastern Time format (YYYY-MM-DD)
- Check database has data: `/supabase query time_entries`
