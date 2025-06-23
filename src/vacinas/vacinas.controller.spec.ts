import { Test, TestingModule } from '@nestjs/testing';
import { VacinasController } from './vacinas.controller';
import { VacinasService } from './vacinas.service';

describe('VacinasController', () => {
  let controller: VacinasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VacinasController],
      providers: [VacinasService],
    }).compile();

    controller = module.get<VacinasController>(VacinasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
