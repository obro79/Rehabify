"""The choke point is only as good as the guarantee that nothing routes around it.

`build_deepgram_url` welding `mip_opt_out=true` onto every URL is worth exactly
nothing if some other module can assemble its own. That is not a hypothetical
failure — it is the specific one 05 §2 cites as the reason we do not let the
browser talk to Deepgram directly: "a stale or tampered client silently enters
PHI into a training corpus."

So this test does not check behaviour. It walks the AST of every module in the
package and fails if any of them, other than the builder itself, mentions a
Deepgram host, a Deepgram path, or the configured host setting.
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

PACKAGE_ROOT = Path(__file__).resolve().parents[1] / "src" / "voice_gateway"

BUILDER_MODULE = PACKAGE_ROOT / "deepgram" / "urls.py"
CONFIG_MODULE = PACKAGE_ROOT / "config.py"

# Any of these appearing in a string literal means someone is assembling a URL.
FORBIDDEN_SUBSTRINGS = (
    "deepgram.com",
    "/v1/listen",
    "/v2/listen",
    "/v1/speak",
    "/v2/speak",
    "/v1/auth/grant",
    "wss://",
)

# Reading the host setting outside the builder is how an f-string URL starts.
FORBIDDEN_ATTRIBUTES = ("deepgram_host",)


def _package_modules() -> list[Path]:
    return sorted(p for p in PACKAGE_ROOT.rglob("*.py"))


def test_the_builder_and_config_are_where_we_think_they_are() -> None:
    # Guards against this whole test silently passing because someone moved or
    # renamed the module it is supposed to be policing.
    assert BUILDER_MODULE.is_file()
    assert CONFIG_MODULE.is_file()
    assert BUILDER_MODULE in _package_modules()


@pytest.mark.parametrize(
    "module_path",
    [p for p in _package_modules() if p not in {BUILDER_MODULE, CONFIG_MODULE}],
    ids=lambda p: str(p.relative_to(PACKAGE_ROOT)),
)
def test_no_other_module_constructs_a_deepgram_url(module_path: Path) -> None:
    tree = ast.parse(module_path.read_text(encoding="utf-8"), filename=str(module_path))

    offences: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            lowered = node.value.lower()
            for needle in FORBIDDEN_SUBSTRINGS:
                if needle in lowered:
                    offences.append(f"line {node.lineno}: string literal contains {needle!r}")
        elif isinstance(node, ast.Attribute) and node.attr in FORBIDDEN_ATTRIBUTES:
            offences.append(f"line {node.lineno}: reads settings.{node.attr}")

    assert not offences, (
        f"{module_path.relative_to(PACKAGE_ROOT)} looks like it is building a Deepgram "
        "URL itself. Every call site goes through voice_gateway.deepgram.urls, because "
        "mip_opt_out=true is a per-request PHI guarantee and one request missing it is "
        "a disclosure (05 §6).\n  " + "\n  ".join(offences)
    )


def test_docstrings_are_not_a_loophole_in_this_check() -> None:
    """The scan reads string constants, and a docstring is a string constant.

    That means a URL pasted into a docstring fails the test. This is on purpose
    and this test pins it: an example URL in a comment is how a copy-paste
    call site gets written later, and the cost of the false positive is a
    reworded docstring.
    """
    source = 'x = 1\n"""See wss://api.deepgram.com/v1/listen for details."""\n'
    tree = ast.parse(source)
    hits = [
        n
        for n in ast.walk(tree)
        if isinstance(n, ast.Constant)
        and isinstance(n.value, str)
        and "deepgram.com" in n.value.lower()
    ]
    assert hits, "the AST scan must see string constants in docstring position"
