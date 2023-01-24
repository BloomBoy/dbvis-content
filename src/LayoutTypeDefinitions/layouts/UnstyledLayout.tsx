import makeLayout from '../../utils/makeLayout';

interface SlotData {
  }

interface UnstyledLayoutData {}

const ColumnLayout = makeLayout<UnstyledLayoutData, SlotData>({
  name: 'Unstyled',
  title: () => undefined,
  componentContainerFields: {},
  configurableSlotCount: [1, 1],
  subFields: {},
});

export default ColumnLayout;
