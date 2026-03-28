# Federated Planets

Federated Planets is a decentralized space exploration game where every planet is a sovereign website. There is no central server; the universe is formed by the connections between independent owners.

In this universe, your domain name is your destiny.

- **Deterministic Coordinates:** A planet's location in the 1,000 x 1,000 x 1,000 sparsec grid is deterministically calculated by hashing its domain name. This ensures that every domain has a fixed, unique position in space. **Because discovery is tied to the root of the domain and coordinates are hashed from the domain itself, there can only be one planet per domain.**
- **Sovereign Hosting:** Each planet is a standalone website hosted by its owner. You control your planet's appearance, atmosphere, and culture.
- **The Warp Ring:** Every planet features a "Warp Ring" (a modern evolution of the classic _web ring_). This area lists neighboring planets and automatically generates a localized star map.

## Calculating Planet Coordinates

To ensure every planet has a unique and fixed position in the 1000x1000x1000 sparsec grid with high precision, we use a simple, deterministic hashing algorithm based on the MD5 hash of your domain name.

1.  **Normalize your domain:** Take the domain name of your site in lowercase, excluding the protocol and any path (e.g., `federatedplanets.com`).
2.  **Generate MD5 Hash:** Compute the MD5 hash of the normalized domain.
3.  **Extract Coordinates:**
    - **X:** Take the first 6 hex characters of the hash and convert them to a decimal integer. Apply modulo 1,000,000, then divide by 1,000 to get a value with 3 decimal points (e.g., `(int_X % 1000000) / 1000.0`).
    - **Y:** Take the next 6 hex characters of the hash and convert them to a decimal integer. Apply modulo 1,000,000, then divide by 1,000 to get a value with 3 decimal points (e.g., `(int_Y % 1000000) / 1000.0`).
    - **Z:** Take the next 6 hex characters of the hash (starting from index 12) and convert them to a decimal integer. Apply modulo 1,000,000, then divide by 1,000 to get a value with 3 decimal points (e.g., `(int_Z % 1000000) / 1000.0`).

## How Navigation Works

Space travel is as simple as clicking a link.

When you visit a planet, its **Warp Ring** displays other known planets in the federation. These links aren't just text; they are coordinates in the grand map. Clicking a link "jumps" your ship (browser) to a new landing site, where you arrive at a new world.

## Joining the Federation

To add your planet to the map:

1.  **Host your site:** Deploy your site on any domain.
2.  **Planet Discovery:** Add the following tag to your site's **homepage** (the page served at the root `/` path) within the `<head>` section to link your manifest. This link can point to a manifest file located anywhere on your domain:
    ```html
    <link rel="space-manifest" href="/outpost-42/manifest.json" />
    ```
3.  **Create Manifest:** Host a `manifest.json` file (typically located in the same directory as your landing site) containing metadata:
    ```json
    {
      "name": "Your Planet Name",
      "description": "A brief description.",
      "landing_site": "https://yourdomain.com/outpost-42/"
    }
    ```
4.  **Add Warp Ring:** Add a "Warp Ring" section to your site, linking to at least one other planet to stay connected to the network.

---

## Reference Implementations

You can find a few reference implementations:

- Static web site with basic planet implementation: [`static-planet`](https://github.com/sergeychernyshev/static-planet)
- More advanced planet with space port implementation: [`planet`](https://github.com/sergeychernyshev/planet)
