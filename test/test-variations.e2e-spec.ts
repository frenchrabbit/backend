import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { haveTestRunCreated, haveUserLogged } from './preconditions';
import { UserLoginResponseDto } from '../src/users/dto/user-login-response.dto';
import { TestRunsService } from '../src/test-runs/test-runs.service';
import { ProjectsService } from '../src/projects/projects.service';
import { Project } from '@prisma/client';
import { BuildsService } from '../src/builds/builds.service';
import { TestVariationsService } from '../src/test-variations/test-variations.service';

jest.useFakeTimers();

describe('TestVariations (e2e)', () => {
  let app: INestApplication;
  let testRunsService: TestRunsService;
  let usersService: UsersService;
  let projecstService: ProjectsService;
  let buildsService: BuildsService;
  let user: UserLoginResponseDto;
  let project: Project;
  let testVariationsService: TestVariationsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    testRunsService = moduleFixture.get<TestRunsService>(TestRunsService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    projecstService = moduleFixture.get<ProjectsService>(ProjectsService);
    buildsService = moduleFixture.get<BuildsService>(BuildsService);
    testVariationsService = moduleFixture.get<TestVariationsService>(TestVariationsService);

    await app.init();
  });

  beforeEach(async () => {
    user = await haveUserLogged(usersService);
    project = await projecstService.create({ name: 'TestVariations E2E test', mainBranchName: 'master' });
  });

  afterEach(async () => {
    await projecstService.remove(project.id);
    await usersService.delete(user.id);
  });

  afterAll(async () => {
    jest.runOnlyPendingTimers();
    await app.close();
  });

  describe('DELETE /', () => {
    const image_v1 = './test/image.png';

    it('can delete', async () => {
      const { testRun } = await haveTestRunCreated(buildsService, testRunsService, project.id, 'develop', image_v1);
      await testRunsService.approve(testRun.id, false);

      await testVariationsService.delete(testRun.testVariationId);

      expect((await testRunsService.findOne(testRun.id)).testVariationId).toBeNull();
    });
  });
});
