<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
     <div class="page page-reports">

        <!-- Queue  Cards -->
        <div class="queue-card">
          <div class="queue-left">
            <div class="queue-processing-label">Currently Processing</div>
            <div class="queue-number"></div>
            <div class="queue-label">Queue Number</div>
          </div>
          <div class="queue-right">
            <div class="queue-tag"></div>
            <div class="queue-next">Next in line: <strong></strong></div>
            <div class="queue-updated"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h4 class="card-title">All Reports</h4>
            <div class="filter-group">
              <select class="filter-select" id="filter-status">
                <option value="">All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>In Progress</option>
              </select>
              <select class="filter-select" id="filter-type">
                <option value="">All Types</option>
                <option>Peace &amp; Order</option>
                <option>Infrastructure</option>
                <option>Health &amp; Sanitation</option>
                <option>Social Services</option>
              </select>
            </div>
          </div>
          <div class="dtable dtable-reports">
            <div class="dhead">
              <div class="dh">ID</div>
              <div class="dh">Type</div>
              <div class="dh">Specific Complaint</div>
              <div class="dh">Address</div>
              <div class="dh">Additional Notes</div>
              <div class="dh">Media</div>
              <div class="dh">Resident</div>
              <div class="dh">Contact</div>
              <div class="dh">Status</div>
              <div class="dh">Date Filed</div>
              <div class="dh">Updated At</div>
            </div>
            <!-- Content here-->
          </div>
        </div>

      </div>

    
</body>
</html>