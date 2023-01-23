import { Link } from '@contentful/app-sdk';
import { TailwindData, tailwindClassFields } from '../../../shared';
import makeComponent from '../../../utils/makeComponent';

interface BadgeData extends TailwindData {
  icon: Link<'Asset', 'Link'>;
  text: string;
  linkTarget: Link<'Asset' | 'Entry', 'Link'> | string;
};

const Badge = makeComponent<BadgeData>({
  name: 'Badge',
  subFields: {
    ...tailwindClassFields,
    linkTarget: [
      {
        type: 'Symbol',
        required: false,
      },
      { id: 'urlEditor' },
    ],
    text: 'Symbol',
    icon: {
      type: 'Link',
      linkType: 'Asset',
      title: 'Icon',
      required: true,
    },
  },
});

export default Badge;
