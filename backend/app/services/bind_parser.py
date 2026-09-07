import re
from typing import List, Dict, Any

RECORD_TYPES = {"A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "SRV", "PTR", "CAA"}

def parse_bind_zone(zone_content: str, zone_domain: str) -> List[Dict[str, Any]]:
    """
    Parses an RFC 1035 BIND zone file into a list of DNS record dicts.
    Supports $ORIGIN, $TTL, multi-line entries with parentheses, comments (;), and standard record types.
    """
    clean_text = zone_content.replace("\r\n", "\n").replace("\r", "\n")

    # Remove inline comments (semicolons not within quotes)
    lines_no_comments = []
    for line in clean_text.split("\n"):
        in_quote = False
        out_chars = []
        for ch in line:
            if ch == '"':
                in_quote = not in_quote
                out_chars.append(ch)
            elif ch == ';' and not in_quote:
                break
            else:
                out_chars.append(ch)
        lines_no_comments.append("".join(out_chars))

    text_no_comments = "\n".join(lines_no_comments)

    # Collapse multi-line parentheses ( ... ) into a single line
    in_paren = False
    collapsed_chars = []
    for ch in text_no_comments:
        if ch == '(':
            in_paren = True
            collapsed_chars.append(' ')
        elif ch == ')':
            in_paren = False
            collapsed_chars.append(' ')
        elif ch == '\n' and in_paren:
            collapsed_chars.append(' ')
        else:
            collapsed_chars.append(ch)

    collapsed_text = "".join(collapsed_chars)

    origin = zone_domain.rstrip(".") + "."
    default_ttl = 300
    records: List[Dict[str, Any]] = []
    current_name = "@"

    for raw_line in collapsed_text.split("\n"):
        line = raw_line.strip()
        if not line:
            continue

        if line.startswith("$ORIGIN"):
            parts = line.split()
            if len(parts) > 1:
                origin = parts[1].rstrip(".") + "."
            continue

        if line.startswith("$TTL"):
            parts = line.split()
            if len(parts) > 1:
                try:
                    default_ttl = int(parts[1])
                except ValueError:
                    pass
            continue

        tokens = line.split()
        if not tokens:
            continue

        token_idx = 0
        record_name = current_name
        ttl = default_ttl
        record_type = None

        if not raw_line.startswith((" ", "\t")):
            record_name = tokens[0]
            token_idx = 1
        else:
            token_idx = 0

        current_name = record_name

        while token_idx < len(tokens):
            tok = tokens[token_idx].upper()
            if tok.isdigit():
                ttl = int(tok)
                token_idx += 1
            elif tok in ("IN", "CH", "HS"):
                token_idx += 1
            elif tok in RECORD_TYPES:
                record_type = tok
                token_idx += 1
                break
            else:
                break

        if not record_type or token_idx >= len(tokens):
            continue

        val_tokens = tokens[token_idx:]
        val_str = " ".join(val_tokens).strip()

        if record_name == "@":
            fqdn = origin.rstrip(".")
        elif record_name.endswith("."):
            fqdn = record_name.rstrip(".")
        else:
            fqdn = f"{record_name}.{origin.rstrip('.')}"

        if record_type == "TXT":
            val_str = val_str.strip('"\'')

        records.append({
            "record_name": fqdn,
            "record_type": record_type,
            "value": val_str,
            "ttl": ttl,
            "routing_policy": "Simple"
        })

    return records


def generate_bind_zone(zone_domain: str, zone_comment: str, records: List[Any]) -> str:
    """
    Generates an RFC 1035 BIND zone file string from records and zone domain.
    """
    clean_domain = zone_domain.rstrip(".")
    lines = [
        f"; Zone file for {clean_domain}",
        f"; Exported from AWS Route 53 Clone",
        f"; Comment: {zone_comment or 'N/A'}",
        f"$ORIGIN {clean_domain}.",
        f"$TTL 300",
        ""
    ]

    soa_rec = next((r for r in records if (getattr(r, "record_type", "") if hasattr(r, "record_type") else (r.get("record_type") if isinstance(r, dict) else "")) == "SOA"), None)
    if soa_rec:
        val = getattr(soa_rec, "value", "") if hasattr(soa_rec, "value") else soa_rec.get("value", "")
        ttl = getattr(soa_rec, "ttl", 300) if hasattr(soa_rec, "ttl") else soa_rec.get("ttl", 300)
        lines.append(f"@\t{ttl}\tIN\tSOA\t{val}")
    else:
        lines.append(f"@\t900\tIN\tSOA\tns-1.awsdns-01.org. hostmaster.{clean_domain}. 2026090801 7200 3600 1209600 300")

    lines.append("")

    ns_records = [r for r in records if (getattr(r, "record_type", "") if hasattr(r, "record_type") else (r.get("record_type") if isinstance(r, dict) else "")) == "NS"]
    if ns_records:
        lines.append("; Nameservers")
        for r in ns_records:
            name = getattr(r, "record_name", "@") if hasattr(r, "record_name") else r.get("record_name", "@")
            val = getattr(r, "value", "") if hasattr(r, "value") else r.get("value", "")
            ttl = getattr(r, "ttl", 172800) if hasattr(r, "ttl") else r.get("ttl", 172800)
            rel_name = "@" if name == clean_domain or name == f"{clean_domain}." else name.replace(f".{clean_domain}", "")
            for target in val.split("\n"):
                t = target.strip()
                if t:
                    if not t.endswith("."):
                        t += "."
                    lines.append(f"{rel_name}\t{ttl}\tIN\tNS\t{t}")
        lines.append("")

    lines.append("; Resource Records")
    for r in records:
        rtype = getattr(r, "record_type", "") if hasattr(r, "record_type") else (r.get("record_type") if isinstance(r, dict) else "")
        if rtype in ("SOA", "NS"):
            continue
        name = getattr(r, "record_name", "@") if hasattr(r, "record_name") else r.get("record_name", "@")
        val = getattr(r, "value", "") if hasattr(r, "value") else r.get("value", "")
        ttl = getattr(r, "ttl", 300) if hasattr(r, "ttl") else r.get("ttl", 300)

        rel_name = "@" if name == clean_domain or name == f"{clean_domain}." else name.replace(f".{clean_domain}", "")
        
        if rtype == "TXT":
            lines.append(f"{rel_name}\t{ttl}\tIN\tTXT\t\"{val}\"")
        else:
            for v in val.split("\n"):
                v_clean = v.strip()
                if v_clean:
                    lines.append(f"{rel_name}\t{ttl}\tIN\t{rtype}\t{v_clean}")

    return "\n".join(lines) + "\n"
