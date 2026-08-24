# Drone & Sensor Data

Per the exact requirements from the Google Stitch visual source of truth, there are NO dedicated "Drone & Sensor Data" screens in the Stitch project.

The drone and sensor data UI elements (like the GIS mapping layers, Drone Evidence AI Analysis, and Imagery Reconciliation) are embedded within the **MRV Module** (specifically `MrvVerificationWorkspacePage` and `ProjectVerificationPage`).

To adhere strictly to the rule: "Do not invent a new mapping/dashboard experience" and "Implement only what Stitch shows", no new screens have been created in this module.
