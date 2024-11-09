import os
import shutil

def remove_path(path):
    if os.path.isfile(path):
        os.remove(path)
        print(f"File {path} has been removed.")
    elif os.path.isdir(path):
        shutil.rmtree(path)
        print(f"Directory {path} has been removed.")
    else:
        print(f"The path {path} does not exist.")

if __name__ == "__main__":
    path_to_remove = [
        'terraform.tfstate' ,'terraform.tfstate.backup' ,'.terraform.lock.hcl' ,'.terraform'
        ]
    for path in path_to_remove:
        remove_path(path.strip())