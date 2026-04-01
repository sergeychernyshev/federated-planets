# Space Travel Protocol: Elected Traffic Controllers

In the Federated Planets universe, space travel is more than just clicking a link. For a journey to be recognized by the federation, it must be validated by a decentralized set of **Elected Traffic Controllers** to ensure the integrity of the travel logs and prevent "warp-cheating" (teleporting without fuel or proper clearance).

## 1. The Space Port Requirement

Before a planet can participate in the Federated Travel Network (FTN), it must construct a **Space Port**.

- **Definition:** A Space Port is a specialized cryptographic node (or a set of services) hosted on the planet's domain.
- **Function:** It acts as the local gateway for initiating travel plans and serves as a potential **Traffic Controller** for other planets' journeys.
- **Manifest Entry:** A planet with a Space Port must include the `space_port` endpoint in its manifest file, and may optionally declare its travel safety level (`travel_safety_level`):
  ```json
  {
    "name": "Arrakis",
    "landing_site": "https://arrakis.space/outpost-9/",
    "space_port": "https://arrakis.space/outpost-9/api/v1/space-port",
    "travel_safety_level": 1
  }
  ```
  If `travel_safety_level` is not provided, it defaults to `1`. If the declared value is not a valid integer greater than or equal to `1`, travel to or from that planet is impossible — Traffic Controllers validate this value as part of the approval process and will reject any travel plan involving a planet with an invalid `travel_safety_level`.

## 2. The Elected Traffic Controllers Protocol

The Elected Traffic Controllers are a Byzantine Fault Tolerant (BFT) subset of nodes chosen to validate a specific travel transaction.

### Selection (Proximity-Based Sortition)

For every travel plan, a subset of **$N = 3f + 1$** nodes is elected from the **direct neighbors** of the Origin and Destination planets, where $f = \max(f_{origin}, f_{destination})$ and each planet's $f$ value is its declared `travel_safety_level`.

- **Fault Tolerance Level:** Each planet declares its minimum fault tolerance requirement via `travel_safety_level` in its manifest. The effective $f$ for a journey is the higher of the two planets' values.
- **Proportional Representation:** Each planet's neighbors contribute Traffic Controllers in proportion to that planet's `travel_safety_level` relative to the combined total. The planet with the higher level provides proportionally more controllers:
  - Origin neighbors: $\left\lfloor N \times \dfrac{f_{origin}}{f_{origin} + f_{destination}} \right\rceil$ controllers
  - Destination neighbors: $N - \text{origin controllers}$
- **The Pool:** Only planets listed in the `warp-ring` of the respective side's planet, which also host an active **Space Port**, are eligible for that side's allocation.
- **Seed:** The election seed is `hash(Origin_Coords + Destination_Coords + Departure_Timestamp)`.
- **Deterministic Selection:** Each side's controllers are selected by hashing the seed against that side's eligible neighbor list and picking the top required number of results.
- **Why Neighbors?:** This ensures that consensus is reached by nodes that are "locally" aware of the participants, reducing global network noise and ensuring that only relevant parties validate the travel.

### Consensus Algorithm (PBFT Subset)

Once the Traffic Controllers are elected, they reach consensus on the travel plan using a three-phase process:

1.  **Pre-Prepare:** The Origin Space Port broadcasts the Travel Port to the elected Traffic Controllers. The "Primary" (the first node in the elected list) assigns a sequence number.
2.  **Prepare:** Traffic Controllers verify the plan (checking fuel, ship integrity, and path). If valid, they broadcast a "Prepare" message to all other controllers.
3.  **Commit:** Once a Traffic Controller receives $2f$ matching Prepare messages, they broadcast a "Commit" message. When $2f + 1$ Commit messages are collected, the travel plan is officially "Approved."

## 3. Travel Mechanics: Distance and Time

The Federated Travel Network (FTN) uses the deterministic coordinate system described in the `README.md` to calculate flight duration.

### Distance Calculation

The distance $D$ between two planets $(x_1, y_1, z_1)$ and $(x_2, y_2, z_2)$ is the Euclidean distance on the **sparsec** grid:
$$D = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2 + (z_2 - z_1)^2}$$

Coordinates are expressed in the standard federation format `X:Y:Z`.

### Travel Time

Travel is not instantaneous. The travel time ($T$) is proportional to the distance ($D$). The current standard warp speed is **1 flight-year per 100 sparsecs**, where **one flight-year is exactly 1 Earth hour**.
$$T = \frac{D}{100} \text{ flight-years}$$

Given the 1,000x1,000x1,000 grid, the maximum possible distance between two planets is approximately **1,732 sparsecs**, resulting in a maximum travel time of roughly **17.32 flight-years (17 hours and 19 minutes)**.

### Transit Visibility

During the journey, the ship is visible to the public record of both the **Origin** and **Destination** planets:

1.  **Preparation (Origin):** Once the **Elected Traffic Controllers** approve the plan, but before the `Start_Timestamp` is reached, the origin planet displays the ship as **"Preparing for Departure"**.
2.  **Departure (Origin):** As soon as the `Start_Timestamp` is reached, the status changes to **"In Transit"**.
3.  **Arrival (Destination):** Simultaneously, the destination planet's Space Port displays the ship as an **"Incoming"** vessel, along with its estimated time of arrival (ETA) based on the `End_Timestamp`.
4.  **Completion:** Once the `End_Timestamp` has passed, the traveler is automatically considered landed at the destination planet.

## 4. The Travel Plan Algorithm

A journey follows these steps:

1.  **Initiation:** The traveler requests a route at the **Origin Space Port**.
2.  **Validation:** The **Elected Traffic Controllers** calculate the distance and duration, ensuring the traveler has the necessary clearance.
3.  **Recording:** The approved plan, including the **Start Timestamp** and **End Timestamp**, is signed by the controllers and stored in the **Distributed Travel Ledger (DTL)**.
4.  **Preparation Phase:** The ship enters a preparation state. It is visible on the origin's traffic log as "Preparing for Departure" until the `Start_Timestamp`.
5.  **Transit:** At the `Start_Timestamp`, the ship officially departs. Both origin and destination planets display the active ship status in their respective "Space Port Traffic" logs.
6.  **Arrival:** Arrival verification happens immediately when the plan is filed with the destination planet, which happens at the same time as it is filed with the departure planet.
7.  **Archival:** Once a journey is completed, both the Origin and Destination Space Ports move the record to their **Mission Archive**, keeping a history of the 10 most recent arrivals and departures for public audit.

## 5. Fault Tolerance and Security

- **Byzantine Resistance:** By requiring $3f+1$ nodes, the protocol remains secure even if $f$ Traffic Controllers are offline or malicious.
- **No Latency Constraints:** Since travel takes time in-game, the consensus process has ample time (from minutes to several flight-years) to complete without impacting the player experience.
- **Auditability:** Any planet can verify the signatures on a travel plan to confirm it was validated by the correct, deterministically elected Traffic Controllers.

## 6. Why "Elected Traffic Controllers" for Games?

In a game where **latency is not a primary concern**, the Elected Traffic Controllers model offers several advantages over traditional game servers:

1.  **Trustless Anti-Cheat:** Because the Traffic Controllers are elected from the network (other players), no single player can "hack" their own travel logs. The rules are enforced by the subset of honest nodes.
2.  **Privacy (Fog of War):** By using a subset of nodes, we can keep the full details of a travel plan (like cargo or ship armaments) private from the general public, only revealing them to the elected controllers who are sworn to secrecy by the protocol.
3.  **Cost Efficiency:** Instead of requiring every node in the entire federation to validate every small move, only a small subset ($3f+1$) handles the work, allowing the network to scale to millions of planets.

## 7. Planetary Sovereignty Over Travel

Each planet retains the right to accept or decline any travel request according to its own rules and policies.

- **Right to Decline:** A planet may refuse any inbound or outbound travel request. When declining, the planet **must** provide a reason in its response. This reason is surfaced directly in the traveler's UI so the traveler understands why their journey was denied.
- **Increased Security Requirements:** A planet may impose stricter consensus requirements than the federation default by setting a higher `travel_safety_level` in its manifest. The higher of the two planets' `travel_safety_level` values is used as $f$ in the $3f+1$ Traffic Controller election formula for that journey.
- **Non-Discriminatory Disclosure:** Declined requests and their stated reasons are recorded in the planet's public travel log, ensuring transparency and accountability.

## 8. Planet-Funded Shuttle Limits

To support future commercial space travel, planets fund shuttle services between select destinations. The following shuttle capacity limits apply to routes between planets at any given time:

| Neighbor Relationship                                     | Max Concurrent Shuttles |
| --------------------------------------------------------- | ----------------------- |
| Both planets mutually list each other as neighbors        | 2 shuttles              |
| Only one planet lists the other as a neighbor (one-sided) | 1 shuttle               |
| Neither planet lists the other as a neighbor              | Not allowed             |

- **Mutual neighbors:** A maximum of **2 shuttles** may travel between two planets at any given time if both planets list each other in their respective `warp-ring`.
- **One-sided neighbor:** A maximum of **1 shuttle** may travel between two planets at any given time when only one of the two planets lists the other in its `warp-ring`.
- **Non-neighbors:** No planet-funded shuttle service operates between two planets if neither planet lists the other in its `warp-ring`.

---

_Document Version: 1.4.0_

_Protocol Status: Draft_
