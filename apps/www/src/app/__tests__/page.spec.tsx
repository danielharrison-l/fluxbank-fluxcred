import { render } from "@testing-library/react";
import Page from "../page";

describe("Home Page", () => {
  it("renders the landing page without the footer link section", () => {
    const { container, getByRole } = render(<Page />);

    expect(
      getByRole("heading", {
        name: /Cr.*dito mais justo para quem trabalha/,
      }),
    ).toBeInTheDocument();
    expect(container.querySelector("#problem")).toBeInTheDocument();
    expect(container.querySelector("#features")).toBeInTheDocument();
    expect(container.querySelector("#open-source")).toBeInTheDocument();
    expect(getByRole("contentinfo")).not.toHaveTextContent("Links");
  });
});
