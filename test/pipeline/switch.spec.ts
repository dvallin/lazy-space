import { Switch, pushOf, Push, Eval, Some } from "../../src"

describe("Switch", () => {

    beforeEach(() => {
        jest.resetAllMocks()
    })

    describe("one case switch", () => {
        const monthSwitch = new Switch<Date, number>(i => i.getMonth())
        const januaryPush = mockPush()
        monthSwitch.add(0, januaryPush.push)

        it("calls matching case", () => {
            monthSwitch.push(new Date(1900, 0))
            expect(januaryPush.mock).toHaveBeenCalled()
        })

        it("does nothing if no case is matched", () => {
            monthSwitch.push(new Date(1900, 1))
            expect(januaryPush.mock).toHaveBeenCalledTimes(0)
        })
    })

    describe("multiple case switch", () => {
        const monthSwitch = new Switch<Date, number>(i => i.getMonth())
        const januaryPush = mockPush()
        monthSwitch.add(0, januaryPush.push)
        const februaryPush = mockPush()
        monthSwitch.add(1, februaryPush.push)

        it("calls matching case 1", () => {
            monthSwitch.push(new Date(1900, 0))
            expect(januaryPush.mock).toHaveBeenCalled()
            expect(februaryPush.mock).not.toHaveBeenCalled()
        })

        it("calls matching case 2", () => {
            monthSwitch.push(new Date(1900, 1))
            expect(januaryPush.mock).not.toHaveBeenCalled()
            expect(februaryPush.mock).toHaveBeenCalled()
        })

        it("does nothing if no case is matched", () => {
            monthSwitch.push(new Date(1900, 2))
            expect(januaryPush.mock).toHaveBeenCalledTimes(0)
        })
    })

    describe("defaulting", () => {
        const defaultingPush = mockPush()
        const monthSwitch = new Switch<Date, number>(i => i.getMonth(), new Some(defaultingPush.push))

        it("defaults", () => {
            monthSwitch.push(new Date(1900, 0))
            expect(defaultingPush.mock).toHaveBeenCalled()
        })
    })


    function mockPush<T>(): { push: Push<T>, mock: jest.Mock<{}> } {
        const mock = jest.fn()
        return {
            push: pushOf<T>(i => {
                mock(i)
                return Eval.noop()
            }),
            mock
        }
    }
})
