import {
  Channel,
  ChannelType,
  Guild,
  GuildScheduledEventCreateOptions,
  Message,
  MessageCreateOptions,
  MessagePayload,
  NewsChannel,
  TextChannel,
} from 'discord.js';

import { Client } from '../../core/Client';
import { Embed } from '../../utils/embeds/Embed';

export class Broadcaster {
  /**
   * The client instance.
   */
  readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Broadcasts a message to a channel.
   * 
   * @param channel - The channel to broadcast the message to.
   * @param message - The message to broadcast.
   */
  async broadcast(channel: Channel, message: string | MessagePayload | MessageCreateOptions): Promise<void> {

    (await this.client.cluster
      .broadcastEval(async (c, { channelId }) => {

        let channel = c.channels.cache.get(channelId);

        if (!channel) return;

        if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type))
          return;

        channel = channel as TextChannel | NewsChannel;

        (await channel.messages.fetch()).filter((m) => m.author.id === this.client.user?.id).map((m) => m.delete());

        channel.send(message);
      }, {
        context: { channelId: channel.id },
      }));
  }

  /**
   * Schedules an event for a guild.
   *
   * @param guild - The guild to schedule the event for.
   * @param options - The options for the event.
   *
   * @returns {Promise<void>} Nothing.
   */
  async scheduleEvent(
    guild: Guild,
    options: GuildScheduledEventCreateOptions,
  ): Promise<void> {

    if (!guild) return;

    this.client.logger.info(`Creating scheduled event for guild ${guild.id}`);

    try {
      await guild.scheduledEvents.create(options);
    } catch (error) {
      this.client.logger.error(error);
    }

    this.client.logger.info(`Scheduled event created for guild ${guild.id}`);
  }
}