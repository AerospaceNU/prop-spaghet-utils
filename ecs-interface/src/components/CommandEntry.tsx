import type {Command} from "./CreateSequenceModal.tsx";

interface CommandEntryInterface {
    orderIndex: number
    command: Command
}

export default function CommandEntry({orderIndex, command}: CommandEntryInterface) {

    return (
        <div>
            {orderIndex}. {command.commandName} {command.timeUntilExecute ?? 0} seconds
        </div>
    );
}