import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminVerifyOtp } from './admin-verify-otp';

describe('AdminVerifyOtp', () => {
  let fixture: ComponentFixture<AdminVerifyOtp>;
  let component: AdminVerifyOtp;
  let inputs: NodeListOf<HTMLInputElement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminVerifyOtp],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminVerifyOtp);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputs = fixture.nativeElement.querySelectorAll('.otp-inputs input');
  });

  function pressKey(index: number, key: string): void {
    inputs[index].focus();
    inputs[index].dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
  }

  function values(): string[] {
    return Array.from(inputs, (input) => input.value);
  }

  it('accepts digits in order and replaces only the selected digit', () => {
    for (let index = 0; index < 6; index++) {
      pressKey(index, String(index + 1));
      expect(document.activeElement).toBe(inputs[Math.min(index + 1, 5)]);
    }

    expect(values()).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(component.otpCode).toBe('123456');

    inputs[2].focus();
    pressKey(2, '9');

    expect(values()).toEqual(['1', '2', '9', '4', '5', '6']);
  });

  it('clears the current digit or the previous digit and moves focus back', () => {
    pressKey(0, '1');
    pressKey(1, '2');

    pressKey(1, 'Backspace');
    expect(values()).toEqual(['1', '', '', '', '', '']);

    pressKey(1, '3');
    pressKey(2, 'Backspace');
    expect(values()).toEqual(['1', '', '', '', '', '']);
    expect(document.activeElement).toBe(inputs[1]);

    inputs[0].focus();
    pressKey(0, 'Backspace');
    expect(values()).toEqual(['', '', '', '', '', '']);
  });

  it('moves focus with arrow keys', () => {
    inputs[2].focus();
    pressKey(2, 'ArrowLeft');
    expect(document.activeElement).toBe(inputs[1]);

    pressKey(1, 'ArrowRight');
    expect(document.activeElement).toBe(inputs[2]);
  });

  it('distributes a pasted six-digit code in order', () => {
    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => '123456' },
    });

    inputs[0].dispatchEvent(pasteEvent);
    fixture.detectChanges();

    expect(values()).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(component.otpCode).toBe('123456');
    expect(document.activeElement).toBe(inputs[5]);
  });

  it('distributes digits received through an input event', () => {
    inputs[0].value = '12a34';
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(values()).toEqual(['1', '2', '3', '4', '', '']);
    expect(component.otpCode).toBe('1234');
    expect(document.activeElement).toBe(inputs[4]);
  });
});
