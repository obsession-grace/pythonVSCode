from invoke import task


@task(name="news")
def news(ctx):
    """
    Create news files
        :param ctx:
    """
    try:
        import os
        import sys
        import os.path

        new_cwd = os.path.join(os.getcwd(), "news")
        sys.path.append(new_cwd)
        import runpy

        runpy.run_module("announce", run_name="__main__", alter_sys=True)
    except Exception:
        raise


@task(name="tpn")
def tpn(ctx):
    """
    Create third party notices files
        :param ctx:
    """
    try:
        import os
        import sys
        import os.path

        new_cwd = os.path.join(os.getcwd(), "news")
        sys.path.append(new_cwd)
        import runpy

        runpy.run_module("announce", run_name="__main__", alter_sys=True)
    except Exception:
        raise
