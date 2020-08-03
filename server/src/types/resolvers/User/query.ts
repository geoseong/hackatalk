import { queryField, stringArg } from '@nexus/schema';

import { FindManyUserArgs } from '@prisma/client';
import { getUserId } from '../../../utils/auth';

export const me = queryField('me', {
  type: 'User',
  resolve: (parent, args, ctx) => {
    const userId = getUserId(ctx);

    return ctx.prisma.user.findOne({
      where: {
        id: userId,
      },
      include: {
        profile: true,
      },
    });
  },
});

export const usersQueryField = queryField((t) => {
  t.connectionField('users', {
    type: 'User',
    additionalArgs: {
      email: stringArg(),
      name: stringArg(),
    },
    async nodes(_, args, ctx) {
      const { first, after, before, last, email, name } = args;

      console.log('args', args);

      const defaultFindManyParams = {
        where: {
          email: {
            contains: email,
          },
          name: {
            contains: name,
          },
          deletedAt: null,
        },
      };

      const cursorParam =
        after || before ? { cursor: { id: after || before } } : {};
      // Important to always fetch one more item so that we can know if there's a next page
      // TODO: deal with last args
      const takeParam = first || last ? { take: (first || last) + 1 } : {};
      const findManyParams: FindManyUserArgs = {
        ...cursorParam,
        ...takeParam,
        ...defaultFindManyParams,
      };

      console.log('findManyParams', findManyParams)

      const users = await ctx.prisma.user.findMany(findManyParams);
      return users;
    },
  });
});
