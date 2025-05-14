import { Test, TestingModule } from '@nestjs/testing';
import { FelinoService } from './felino.service';

describe('FelinoService', () => {
  let service: FelinoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FelinoService],
    }).compile();

    service = module.get<FelinoService>(FelinoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
