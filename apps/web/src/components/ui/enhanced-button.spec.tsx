import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EnhancedButton } from "./enhanced-button";

describe("EnhancedButton", () => {
	it("renders children and respects disabled when loading", () => {
		render(<EnhancedButton isLoading>Submit</EnhancedButton>);
		const button = screen.getByRole("button", { name: "Submit" });
		expect(button).toBeDisabled();
	});

	it("renders left icon when provided", () => {
		render(
			<EnhancedButton leftIcon={<span data-testid="left">L</span>}>
				Go
			</EnhancedButton>,
		);

		expect(screen.getByTestId("left")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Go/ })).toBeEnabled();
	});
});
