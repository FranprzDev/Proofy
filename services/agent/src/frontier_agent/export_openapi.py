"""Export the OpenAPI contract used to generate the TypeScript client in Next.js."""

import json
import sys

from frontier_agent.api.app import app


def main() -> None:
    out = sys.argv[1] if len(sys.argv) > 1 else "openapi.json"
    with open(out, "w") as f:
        json.dump(app.openapi(), f, indent=2)


if __name__ == "__main__":
    main()
