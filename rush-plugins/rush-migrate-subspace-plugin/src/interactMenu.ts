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

      case 'analyze':
        await generateReport();
        Console.newLine();
        break;

      case 'move':
        await migrateProject();
        Console.newLine();
        break;

      case 'sync':
        await syncVersions();
        Console.newLine();
        break;
    }
  } while (!exitApplication);

  Console.log('👋 Exiting application... Bye!');
};
