import { Test, TestingModule } from '@nestjs/testing';
import { VacinasService } from './vacinas.service';

describe('VacinasService', () => {
  let service: VacinasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VacinasService],
    }).compile();

    service = module.get<VacinasService>(VacinasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
