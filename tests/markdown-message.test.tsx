import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarkdownMessage } from "@/components/ai/markdown-message";

describe("MarkdownMessage", () => {
  it("renders headings, lists and emphasis", () => {
    render(
      <MarkdownMessage
        content={"# Resumo\n\n- Primeiro item\n- Segundo item\n\n**Importante**"}
      />,
    );

    expect(screen.getByRole("heading", { name: "Resumo" })).toBeInTheDocument();
    expect(screen.getByText("Primeiro item")).toBeInTheDocument();
    expect(screen.getByText("Segundo item")).toBeInTheDocument();
    expect(screen.getByText("Importante")).toBeInTheDocument();
  });

  it("opens rendered links safely in a new tab", () => {
    render(<MarkdownMessage content={"[Documentação](https://example.com)"} />);

    const link = screen.getByRole("link", { name: "Documentação" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
