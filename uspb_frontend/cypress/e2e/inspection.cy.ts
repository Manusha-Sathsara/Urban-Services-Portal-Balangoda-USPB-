describe('Environmental Inspection Workflow', () => {
  it('successfully submits an approved inspection', () => {
    // 1. Open the page
    cy.visit('http://localhost:3100/admin-inspection');

    // 2. Fill out the form
    cy.get('input[type="number"]').type('2'); 
    cy.get('select').select('APPROVED');
    cy.get('textarea').type('Automated Cypress test execution successful.');

    // 3. Listen for the success alert
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Status updated successfully!');
    });

    // 4. Click the submit button
    cy.contains('button', 'Submit Inspection').click();
  });
});