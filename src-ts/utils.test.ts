/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest';
import { getCellReference, getColumnName, getSelectionReference } from './types';
import {
  buildValidationTooltipContent,
  isImeCompositionKey,
  isKeyboardShortcut,
  parseCellReference,
} from './utils';

describe('isImeCompositionKey', () => {
  it('detects active composition state and composing keyboard events', () => {
    expect(isImeCompositionKey({ isComposing: false, keyCode: 13 }, true)).toBe(true);
    expect(isImeCompositionKey({ isComposing: true, keyCode: 13 })).toBe(true);
  });

  it('detects keyCode 229 fallback without blocking regular keys', () => {
    expect(isImeCompositionKey({ isComposing: false, keyCode: 229 })).toBe(true);
    expect(isImeCompositionKey({ isComposing: false, keyCode: 13 })).toBe(false);
  });
});

describe('parseCellReference', () => {
  it('parses uppercase references', () => {
    expect(parseCellReference('A1')).toEqual({ row: 0, col: 0 });
    expect(parseCellReference('B2')).toEqual({ row: 1, col: 1 });
    expect(parseCellReference('AA10')).toEqual({ row: 9, col: 26 });
  });

  it('parses lowercase references', () => {
    expect(parseCellReference('a1')).toEqual({ row: 0, col: 0 });
    expect(parseCellReference('ab5')).toEqual({ row: 4, col: 27 });
  });

  it('returns null for invalid references', () => {
    expect(parseCellReference('')).toBeNull();
    expect(parseCellReference('1A')).toBeNull();
    expect(parseCellReference('A0')).toBeNull();
  });
});

describe('types helpers', () => {
  it('generates column names and cell references', () => {
    expect(getColumnName(0)).toBe('A');
    expect(getColumnName(26)).toBe('AA');
    expect(getCellReference(0, 1)).toBe('B1');
  });

  it('formats range selection references', () => {
    expect(
      getSelectionReference({
        type: 'range',
        hasSelection: true,
        isRange: true,
        start_row: 0,
        start_col: 0,
        end_row: 1,
        end_col: 1,
        cell_count: 4,
      })
    ).toBe('A1:B2');

    expect(
      getSelectionReference({
        type: 'single',
        hasSelection: true,
        isRange: false,
        row: 0,
        col: 0,
        cell_count: 1,
      })
    ).toBe('A1');
  });
});

describe('buildValidationTooltipContent', () => {
  it('renders message as text, not HTML', () => {
    const malicious = '<img src=x onerror="alert(1)">';
    const tooltip = buildValidationTooltipContent(malicious, { isBelow: false, arrowOffset: 20 });
    const body = tooltip.querySelector('div');

    expect(body?.textContent).toBe(malicious);
    expect(body?.innerHTML).not.toContain('<img');
    expect(tooltip.querySelector('img')).toBeNull();
  });

  it('places arrow above body when isBelow is true', () => {
    const tooltip = buildValidationTooltipContent('error', { isBelow: true, arrowOffset: 30 });
    expect(tooltip.children.length).toBe(2);
    expect(tooltip.children[0].style.borderBottom).toContain('6px');
  });
});

describe('isKeyboardShortcut', () => {
  it('matches ctrl+c', () => {
    const event = {
      key: 'c',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    } as KeyboardEvent;

    expect(isKeyboardShortcut(event, 'ctrl+c')).toBe(true);
  });

  it('returns false for malformed shortcut strings', () => {
    const event = {
      key: 'c',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    } as KeyboardEvent;

    expect(isKeyboardShortcut(event, 'ctrl')).toBe(false);
  });
});
