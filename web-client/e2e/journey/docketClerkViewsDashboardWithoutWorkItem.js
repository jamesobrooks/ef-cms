export default test => {
  return it('Docket clerk views their dashboard and should not expect an individual work queue item, but should expect the docket section item', async () => {
    await test.runSequence('gotoDashboardSequence');
    await test.runSequence('switchWorkQueueSequence', {
      queue: 'my',
      box: 'inbox',
    });
    const workItem = test
      .getState('workQueue')
      .find(item => item.workItemId === test.workItemId);
    expect(workItem).toBeUndefined();

    await test.runSequence('switchWorkQueueSequence', {
      queue: 'section',
      box: 'inbox',
    });
    const sectionWorkItems = test
      .getState('workQueue')
      .filter(item => item.docketNumber === test.docketNumber);
    expect(sectionWorkItems.length).toEqual(2);
    test.answerWorkItemId = sectionWorkItems.find(
      item => item.document.documentType === 'Answer',
    ).workItemId;
    test.stipulatedDecisionWorkItemId = sectionWorkItems.find(
      item => item.document.documentType === 'Stipulated Decision',
    ).workItemId;
  });
};
