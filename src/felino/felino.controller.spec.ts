import { Test, TestingModule } from '@nestjs/testing';
import { FelinoController } from './felino.controller';
import { FelinoService } from './felino.service';

describe('FelinoController', () => {
  let controller: FelinoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FelinoController],
      providers: [FelinoService],
    }).compile();

    controller = module.get<FelinoController>(FelinoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
