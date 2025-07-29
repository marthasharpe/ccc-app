import { render, screen, fireEvent } from "@testing-library/react";
import { formatCCCLinks, hasCCCReferences } from "../cccLinkFormatter";

// Mock click handler
const mockOnCCCClick = jest.fn();

describe("formatCCCLinks", () => {
  beforeEach(() => {
    mockOnCCCClick.mockClear();
  });

  it("handles single CCC prefixed numbers", () => {
    const text = "See CCC 123 for more details";
    render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("CCC 123");
    expect(button).toHaveAttribute("title", "Click to read CCC 123");

    fireEvent.click(button);
    expect(mockOnCCCClick).toHaveBeenCalledWith("123");
  });

  it("handles CCC prefixed numbers in parentheses", () => {
    const text = "See (CCC 123) for more details";
    render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("CCC 123");

    fireEvent.click(button);
    expect(mockOnCCCClick).toHaveBeenCalledWith("123");
  });

  it("handles CCC ranges", () => {
    const text = "See CCC 123-125 for more details";
    render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("CCC 123");
    expect(buttons[1]).toHaveTextContent("125");

    fireEvent.click(buttons[0]);
    expect(mockOnCCCClick).toHaveBeenCalledWith("123");

    fireEvent.click(buttons[1]);
    expect(mockOnCCCClick).toHaveBeenCalledWith("125");
  });

  it("handles CCC comma-separated numbers", () => {
    const text = "See CCC 966, 971 for more details";
    render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("966");
    expect(buttons[1]).toHaveTextContent("971");

    fireEvent.click(buttons[0]);
    expect(mockOnCCCClick).toHaveBeenCalledWith("966");

    fireEvent.click(buttons[1]);
    expect(mockOnCCCClick).toHaveBeenCalledWith("971");
  });

  it("handles CCC comma-separated numbers with mismatched parentheses", () => {
    const text = "See CCC 966, 971) for more details";
    render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("966");
    expect(buttons[1]).toHaveTextContent("971");

    fireEvent.click(buttons[0]);
    expect(mockOnCCCClick).toHaveBeenCalledWith("966");

    fireEvent.click(buttons[1]);
    expect(mockOnCCCClick).toHaveBeenCalledWith("971");
  });

  it("handles bare numbers in parentheses", () => {
    const text = "See (123) for more details";
    render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("123");

    fireEvent.click(button);
    expect(mockOnCCCClick).toHaveBeenCalledWith("123");
  });

  it("handles bare comma-separated numbers in parentheses", () => {
    const text = "See (123, 456, 789) for more details";
    render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent("123");
    expect(buttons[1]).toHaveTextContent("456");
    expect(buttons[2]).toHaveTextContent("789");

    fireEvent.click(buttons[1]);
    expect(mockOnCCCClick).toHaveBeenCalledWith("456");
  });

  it("handles mixed formats in one text", () => {
    const text = "See CCC 123, also (456, 789) and CCC 100-102";
    render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5); // 1 + 2 + 2 buttons

    // Test the single CCC number
    fireEvent.click(buttons[0]); // CCC 123
    expect(mockOnCCCClick).toHaveBeenCalledWith("123");

    // Test bare comma-separated numbers in parentheses
    fireEvent.click(buttons[1]); // (456, 789) - first number
    expect(mockOnCCCClick).toHaveBeenCalledWith("456");

    // Test CCC range
    fireEvent.click(buttons[3]); // CCC 100-102 - first number
    expect(mockOnCCCClick).toHaveBeenCalledWith("100");
  });

  it("ignores invalid paragraph numbers", () => {
    const text = "See CCC 9999 and (0, 3000) for details";
    render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0); // No buttons should be rendered for invalid numbers
  });

  it("ignores text without CCC references", () => {
    const text = "Just regular text with no references";
    const result = render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
    expect(result.container.textContent).toBe(text);
  });

  it("preserves non-CCC text around references", () => {
    const text = "Start CCC 123 middle (456) end";
    const result = render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    expect(result.container.textContent).toBe("Start CCC 123 middle (456) end");

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });

  it("handles multiple spaces in CCC references", () => {
    const text = "See CCC   123 for details";
    render(formatCCCLinks({ text, onCCCClick: mockOnCCCClick }));

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("CCC 123");

    fireEvent.click(button);
    expect(mockOnCCCClick).toHaveBeenCalledWith("123");
  });
});

describe("hasCCCReferences", () => {
  it("detects single CCC prefixed numbers", () => {
    expect(hasCCCReferences("See CCC 123")).toBe(true);
    expect(hasCCCReferences("See (CCC 123)")).toBe(true);
  });

  it("detects CCC comma-separated numbers", () => {
    expect(hasCCCReferences("See CCC 123, 456")).toBe(true);
    expect(hasCCCReferences("See CCC 966, 971)")).toBe(true);
  });

  it("detects CCC ranges", () => {
    expect(hasCCCReferences("See CCC 123-125")).toBe(true);
    expect(hasCCCReferences("See (CCC 100-200)")).toBe(true);
  });

  it("detects bare numbers in parentheses", () => {
    expect(hasCCCReferences("See (123)")).toBe(true);
    expect(hasCCCReferences("See (123, 456)")).toBe(true);
  });

  it("ignores invalid numbers", () => {
    expect(hasCCCReferences("See CCC 9999")).toBe(false); // > 2865
    expect(hasCCCReferences("See (0)")).toBe(false); // < 1
    expect(hasCCCReferences("See CCC 0-100")).toBe(false); // range starts with 0
    expect(hasCCCReferences("See (3000, 123)")).toBe(false); // one invalid number
  });

  it("ignores text without references", () => {
    expect(hasCCCReferences("Just regular text")).toBe(false);
    expect(hasCCCReferences("No references here")).toBe(false);
    expect(hasCCCReferences("Some (text) in parentheses")).toBe(false);
  });

  it("handles edge cases", () => {
    expect(hasCCCReferences("CCC 1")).toBe(true); // minimum valid number
    expect(hasCCCReferences("CCC 2865")).toBe(true); // maximum valid number
    expect(hasCCCReferences("(1, 2865)")).toBe(true); // min and max in parentheses
  });

  it("ignores CCC without numbers", () => {
    expect(hasCCCReferences("Just CCC text")).toBe(false);
    expect(hasCCCReferences("CCC is great")).toBe(false);
  });
});
