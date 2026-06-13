import { vi } from "vitest";
import "@testing-library/jest-dom";

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();
