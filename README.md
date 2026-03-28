# Federated Planets (Reference Implementation)

Federated Planets is a decentralized space exploration game where every planet is a sovereign website. There is no central server; the universe is formed by the connections between independent owners.

This repository serves as the **official reference implementation** for a planetary landing site.

## Reference Structure

To serve as a standard planet, this project includes:

- **`index.html`**: The **Landing Site** of the planet. It contains the visual representation of the outpost and the **Warp Ring** interface.
- **`manifest.json`**: The machine-readable metadata file that other explorers use to map your location and find neighbors.
- **`README.md`**: The technical documentation for the federation.

## The Core Concept

In this universe, your domain name is your destiny.

- **Deterministic Coordinates:** A planet's location in the 1,000 x 1,000 parsec grid is deterministically calculated by hashing its domain name. This ensures that every URL has a fixed, unique position in space.
- **Sovereign Hosting:** Each planet is a standalone website hosted by its owner. You control your planet's appearance, atmosphere, and culture.
- **The Warp Ring:** Every planet features a "Warp Ring" (a modern evolution of the classic _web ring_). This area lists neighboring planets and automatically generates a localized star map.

## Calculating Planet Coordinates
## The FP-Hash Algorithm

To ensure every planet has a unique and fixed position in the 1000x1000 parsec grid with high precision, we use a simple, deterministic hashing algorithm based on the MD5 hash of your domain name.

1.  **Normalize your domain:** Take your domain name in lowercase, excluding the protocol (e.g., `federatedplanets.com`).
2.  **Generate MD5 Hash:** Compute the MD5 hash of the normalized domain.
3.  **Extract Coordinates:**
    -   **X:** Take the first 6 hex characters of the hash and convert them to a decimal integer. Apply modulo 1,000,000, then divide by 1,000 to get a value with 3 decimal points (e.g., `(int_X % 1000000) / 1000.0`).
    -   **Y:** Take the next 6 hex characters of the hash and convert them to a decimal integer. Apply modulo 1,000,000, then divide by 1,000 to get a value with 3 decimal points (e.g., `(int_Y % 1000000) / 1000.0`).

## How Navigation Works
Space travel is as simple as clicking a link.

When you visit a planet, its **Warp Ring** displays other known planets in the federation. These links aren't just text; they are coordinates in the grand map. Clicking a link "jumps" your ship (browser) to a new domain, where you arrive at a new world.

## Planet Discovery

To make your planet discoverable and share its data with the federation, you must host a manifest file and link it from your homepage.

1.  **Discovery Link:** Add the following tag to your homepage's `<head>`:
    ```html
    <link rel="space-manifest" href="/manifest.json" />
    ```
2.  **Manifest File:** Your `/manifest.json` should contain basic metadata about your planet, such as its name, description, and the links for its Warp Ring.

## Joining the Federation

To add your planet to the map:

1. Host your site on any domain.
2. Create your `manifest.json` file and link it from your homepage.
3. Calculate your coordinates using the standard algorithm.
4. Add the **Warp Ring** component to your site, linking to at least one other planet to stay connected to the network.
