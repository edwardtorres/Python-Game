class Version:
    def __init__(self, major, minor):
        self.major = major
        self.minor = minor

    def __repr__(self):
        return f"Version({self.major}, {self.minor})"

    def __lt__(self, other):
        return (self.major, self.minor) < (other.major, other.minor)


def sorted_versions(pairs):
    versions = sorted(Version(major, minor) for major, minor in pairs)
    return [repr(version) for version in versions]
