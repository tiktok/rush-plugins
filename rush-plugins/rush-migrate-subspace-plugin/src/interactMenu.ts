import { generateReport } from './generateReport';
import { migrateProject } from './migrateProject';
import { chooseCommandPrompt } from './prompts/command';
import Console from './providers/console';
import { syncVersions } from './syncVersions';

export const interactMenu = async (): Promise<void> => {
  let exitApplication: boolean = false;
  do {
    const nextCommand: string = await chooseCommandPrompt();
    switch (nextCommand) {
      case 'exit':
        exitApplication = true;
        break;

      case 'report':
        await generateReport();
        break;

      case 'move':
        await migrateProject();
        break;

      case 'sync':
        await syncVersions();
        break;
    }
  } while (!exitApplication);

  Console.log('👋 Exiting application... Bye!');
};
