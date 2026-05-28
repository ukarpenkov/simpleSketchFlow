export function initUI(): void {
  const btnGenerate = document.getElementById('btn-generate') as HTMLButtonElement;
  const btnExport = document.getElementById('btn-export') as HTMLButtonElement;

  btnGenerate.addEventListener('click', () => {
    console.log('Generate clicked');
  });

  btnExport.addEventListener('click', () => {
    console.log('Export PDF clicked');
  });
}
