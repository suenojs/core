import chalk from 'chalk';
import { TimeFormat, LogOptions } from './types';

export function formatTime(timeFormat: TimeFormat, showTime: boolean): string {
  if (!showTime) return '';

  const now = Date.now();

  switch (timeFormat) {
    case 'iso':
      return new Date(now).toISOString();
    case 'epoch':
      return now.toString();
    case 'unix':
      return Math.round(now / 1000.0).toString();
    case 'none':
      return '';
    case 'locale':
    default:
      return new Date().toLocaleTimeString('en-US', { hour12: false });
  }
}

export function getLevelColor(level: string): string {
  switch (level.trim().toLowerCase()) {
    case 'error':
      return chalk.redBright(level);
    case 'warn':
      return chalk.yellowBright(level);
    case 'info':
      return chalk.green(level);
    case 'debug':
      return chalk.blue(level);
    default:
      return chalk.white(level);
  }
}

export function formatMessage(
  level: string,
  message: string,
  name: string,
  time: string,
  useAscii: boolean,
  data?: Record<string, any>,
  options?: LogOptions & { indent?: number; isLastInGroup?: boolean },
): string {
  const baseIndent = Math.max(0, Math.floor((options?.indent || 0) / 2));

  // Different prefix handling for groups vs regular logs
  let prefix;
  if (options?.isGroup) {
    prefix = ''; // Group messages handle their own prefixes
  } else {
    // For regular messages, add vertical lines for depth and a branch for the message
    prefix = options?.indent
      ? useAscii
        ? options?.isLastInGroup
          ? '|   '.repeat(baseIndent - 1) + '`-- ' // Use closing branch for last entry
          : '|   '.repeat(baseIndent - 1) + '|-- '
        : options?.isLastInGroup
          ? '│ '.repeat(baseIndent - 1) + '╰─ ' // Use closing branch for last entry
          : '│ '.repeat(baseIndent - 1) + '├─ '
      : '';
  }

  // Format the message differently for groups vs regular logs
  let formattedMessage = '';
  const levelUpper = level.trim().toUpperCase().padEnd(5);

  if (options?.isGroup) {
    if (options?.isGroupEnd) {
      return ''; // Return empty string for group end - it will be handled by the logger
    }
    formattedMessage = `${message}`; // Group messages are pre-formatted
  } else {
    // Regular log message formatting with proper indentation
    const logPrefix = useAscii ? '' : '│ '.repeat(Math.max(0, baseIndent - 1));
    const timeStr = time ? `${time} ` : '';

    switch (levelUpper.trim()) {
      case 'ERROR':
        formattedMessage = `${logPrefix}${prefix}${timeStr}${chalk.redBright(
          `[${levelUpper}]`,
        )} ${chalk.cyan(name)}: ${chalk.redBright(message)}`;
        break;
      case 'WARN':
        formattedMessage = `${logPrefix}${prefix}${timeStr}[${chalk.yellowBright(
          levelUpper,
        )}] ${chalk.cyan(name)}: ${chalk.yellowBright(message)}`;
        break;
      default:
        formattedMessage = `${logPrefix}${prefix}${timeStr}[${getLevelColor(
          levelUpper,
        )}] ${chalk.cyan(name)}: ${message}`;
    }
  }

  const parts: string[] = [formattedMessage];

  if (data) {
    const dataIndent = options?.isGroup ? '│ '.repeat(baseIndent + 1) : '│ '.repeat(baseIndent);
    const dataLines = JSON.stringify(data, null, 2)
      .split('\n')
      .map((line, index) => {
        const dataPrefix = index === 0 ? '├─ ' : '│  ';
        const coloredLine =
          levelUpper.trim() === 'ERROR'
            ? chalk.redBright(line)
            : levelUpper.trim() === 'WARN'
              ? chalk.yellowBright(line)
              : chalk.gray(line);
        return `${dataIndent}${dataPrefix}${coloredLine}`;
      })
      .join('\n');
    parts.push(dataLines);
  }

  return parts.join('\n');
}
