import { TestBed } from '@angular/core/testing';

import { XmlConverterService } from './xml-converter.service';

describe('XmlConverterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: XmlConverterService = TestBed.get(XmlConverterService);
    expect(service).toBeTruthy();
  });
});
