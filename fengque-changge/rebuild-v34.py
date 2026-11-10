from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parent
book=Path(sys.argv[1]) if len(sys.argv)>1 else root/'editable-v34.xlsx'
subprocess.run([sys.executable,'-I','-X','utf8',str(root/'源代码'/'import_editable_v34.py'),str(book)],check=True)
subprocess.run([sys.executable,'-I','-X','utf8',str(root/'源代码'/'build_web_demo.py')],check=True)
print('OK: index.html rebuilt. Open it to play your edited version.')
