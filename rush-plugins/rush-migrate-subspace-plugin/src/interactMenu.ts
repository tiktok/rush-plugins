import { cleanSubspace } from './cleanSubspace';
import { migrateProject } from './migrateProject';
import { chooseCommandPrompt } from './prompts/command';
import Console from './providers/console';
import { syncVersions } from './syncVersions';

export const interactMenu = async (targetMonorepoPath: string): Promise<void> => {
  let exitApplication: boolean = false;
  do {
    const nextCommand: string = await chooseCommandPrompt();
    switch (nextCommand) {
      case 'exit':
        exitApplication = true;
        break;

      case 'move':
        await migrateProject(targetMonorepoPath);
        Console.newLine();
        break;

      case 'sync':
        await syncVersions(targetMonorepoPath);
        Console.newLine();
        break;

      case 'clean':
        await cleanSubspace(targetMonorepoPath);
        Console.newLine();
        break;
    }
  } while (!exitApplication);

  Console.log('👋 Exiting application... Bye!');
};
